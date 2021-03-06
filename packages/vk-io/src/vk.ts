import { Agent } from 'https';

import { API } from './api';
import { Upload } from './upload';
import { Collect } from './collect';
import { Updates } from './updates';
import { Snippets } from './snippets';
import { inspectable } from './utils/inspectable';
import { CallbackService } from './utils/callback-service';

import { IVKOptions } from './types';

import { defaultOptions } from './utils/constants';

/**
 * Main class
 */
export class VK {
	public options: IVKOptions = {
		...defaultOptions,

		agent: new Agent({
			keepAlive: true,

			keepAliveMsecs: 10000
		})
	};

	public api = new API(this);

	public upload = new Upload(this);

	public collect = new Collect(this);

	public updates = new Updates(this);

	public snippets = new Snippets(this);

	public callbackService = new CallbackService(this);

	/**
	 * Constructor
	 */
	public constructor(options: Partial<IVKOptions> = {}) {
		this.setOptions(options);
	}

	/**
	 * Returns custom tag
	 */
	public get [Symbol.toStringTag](): string {
		return this.constructor.name;
	}

	/**
	 * Sets options
	 */
	public setOptions(options: Partial<IVKOptions>): this {
		Object.assign(this.options, options);

		return this;
	}

	/**
	 * Sets token
	 */
	public set token(token: string | undefined) {
		this.options.token = token;
	}

	/**
	 * Returns token
	 */
	public get token(): string | undefined {
		return this.options.token;
	}

	/**
	 * Sets captcha handler
	 *
	 * ```ts
	 * vk.captchaHandler = (payload, retry) => {...};
	 * ```
	 */
	public set captchaHandler(handler: Function) {
		this.callbackService.captchaHandler = handler;
	}

	/**
	 * Sets two-factor handler
	 *
	 * ```ts
	 * vk.twoFactorHandler = (payload, retry) => {...};
	 * ```
	 */
	public set twoFactorHandler(handler: Function) {
		this.callbackService.twoFactorHandler = handler;
	}
}

inspectable(VK, {
	serialize: ({
		api,
		updates,
		options: { appId, token }
	}) => ({
		options: { appId, token },
		api,
		updates
	})
});
