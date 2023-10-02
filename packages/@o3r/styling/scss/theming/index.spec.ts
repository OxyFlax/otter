import { compileString } from 'sass';
import { resolve } from 'node:path';

const url = new URL('.', 'file://' + resolve(__dirname, '..', '..', 'test.scss'));
const indexFile = './testing/index'; // deprecated, should be './index' when Angular Material is moved to sub-entry

describe('Theming functions', () => {
  describe('var mixin', () => {
    it('should define new variable', () => {
      const mock = `@use '${indexFile}' as o3r;
:root {
  @include o3r.var('test-color-1', #000, (description: 'test description'));
  @include o3r.var('--test-color-2', #fff, (description: 'test description'));
}`;
      const result = compileString(mock, { url });
      expect(result.css.replaceAll(/[\n\r\s]/g, '')).toEqual(':root{--test-color-1:#000;--test-color-2:#fff;}');
    });
  });

  describe('var function', () => {
    it('should define new variable', () => {
      const mock = `@use '${indexFile}' as o3r;
$myVar1: o3r.var('test-color-1', #000, (description: 'test description'));
$myVar2: o3r.var('--test-color-2', #fff, (description: 'test description'));
body {
  background-color: $myVar1;
  color: $myVar2;
}`;
      const result = compileString(mock, { url });
      expect(result.css.replaceAll(/[\n\r\s]/g, '')).toEqual('body{background-color:var(--test-color-1,#000);color:var(--test-color-2,#fff);}');
    });
  });
});
