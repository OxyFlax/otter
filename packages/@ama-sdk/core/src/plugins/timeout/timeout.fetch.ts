import { ResponseTimeoutError } from '../../fwk/errors';
import { FetchCall, FetchPlugin, FetchPluginContext } from '../core';

/**
 * Representation of an Imperva Captcha message
 */
type ImpervaCaptchaMessageData = {
  impervaChallenge: {
    type: 'captcha';
    status: 'started' | 'ended';
    timeout: number;
    url: string;
  };
};


/**
 * Check if a message can be cast as an {@link ImpervaCaptchaMessage}
 * @param message
 */
function isImpervaCaptchaMessage(message: any): message is ImpervaCaptchaMessageData {
  return Object.prototype.hasOwnProperty.call(message, 'impervaChallenge') &&
    Object.prototype.hasOwnProperty.call(message.impervaChallenge, 'status') &&
    Object.prototype.hasOwnProperty.call(message.impervaChallenge, 'type') && message.impervaChallenge.type === 'captcha';
}

export type TimeoutPauseEventHandler = ((timeoutPauseCallback: (isTimeoutPaused: boolean) => void, context: any) => () => void);
export type TimeoutPauseEventHandlerFactory<T> = (config?: Partial<T>) => TimeoutPauseEventHandler;

/**
 * Captures Imperva captcha events and calls the event callback
 * It can only be used for browser's integrating imperva captcha
 *
 * @param timeoutPauseCallback: callback that subscribes to the captcha event
 * @param context in which the callback should be executed
 *
 * @return removeEventListener
 */
export const impervaCaptchaEventHandlerFactory: TimeoutPauseEventHandlerFactory<{whiteListedHostNames: string[]}> = (config) =>
  (timeoutPauseCallback: (timeoutStatus: boolean) => void, context: any) => {
    const onImpervaCaptcha = ((event: MessageEvent<any>) => {
      const originHostname = (new URL(event.origin)).hostname;
      if (originHostname !== location.hostname && (config?.whiteListedHostNames || []).indexOf(originHostname) === -1) {
        return;
      }
      const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (message && isImpervaCaptchaMessage(message)) {
        timeoutPauseCallback(message.impervaChallenge.status === 'started');
      }
    }).bind(context);
    addEventListener('message', onImpervaCaptcha);
    return () => {
      removeEventListener('message', onImpervaCaptcha);
    };
  };

/**
 * Plugin to fire an exception on timeout
 */
export class TimeoutFetch implements FetchPlugin {

  /** Fetch timeout (in millisecond) */
  public timeout: number;
  private timerSubscription: ((pauseStatus: boolean) => void)[] = [];
  private timerPauseState = false;

  /**
   * Timeout Fetch plugin.
   *
   * @param timeout Timeout in millisecond
   * @param timeoutPauseEvent Event that will trigger the pause and reset of the timeout
   */
  constructor(timeout = 60000, private timeoutPauseEvent?: TimeoutPauseEventHandler) {
    this.timeout = timeout;
    if (this.timeoutPauseEvent) {
      this.timeoutPauseEvent((pausedStatus: boolean) => {
        this.timerPauseState = pausedStatus;
        this.timerSubscription.forEach((timer) => timer.bind(this)(pausedStatus));
      }, this);
    }
  }

  public load(context: FetchPluginContext) {
    return {
      transform: (fetchCall: FetchCall) =>
        // eslint-disable-next-line no-async-promise-executor
        new Promise<Response>(async (resolve, reject) => {
          const timeoutCallback = () => {
            reject(new ResponseTimeoutError(`in ${this.timeout}ms`));
            // Fetch abort controller is now supported by all modern browser and node 15+. It should always be defined
            context.controller?.abort();
          };
          let timer = this.timerPauseState ? undefined : setTimeout(() => timeoutCallback(), this.timeout);
          const timerCallback = (pauseStatus: boolean) => {
            if (timer && pauseStatus) {
              clearTimeout(timer);
              timer = undefined;
            } else if (!timer && !pauseStatus) {
              timer = setTimeout(() => timeoutCallback(), this.timeout);
            }
          };
          this.timerSubscription.push(timerCallback);

          try {
            const response = await fetchCall;
            if (!context.controller!.signal.aborted) {
              resolve(response);
            }
          } catch (ex) {
            reject(ex);
          } finally {
            if (timer) {
              clearTimeout(timer);
            }
            this.timerSubscription = this.timerSubscription.filter(callback => timerCallback !== callback);
          }
        })
    };
  }
}
