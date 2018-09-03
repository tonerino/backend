// tslint:disable:no-implicit-dependencies
/**
 * ユーザーテスト
 */
// import * as assert from 'assert';
import * as sinon from 'sinon';

let sandbox: sinon.SinonSandbox;

describe('Write some tests!', () => {
    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('some test', async () => {
        sandbox.verify();
    });
});
