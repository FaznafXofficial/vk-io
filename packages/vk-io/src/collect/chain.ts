import { VKError, ExecuteError } from '../errors';

import { VK } from '../vk';
import { APIRequest } from '../api/request';
import { inspectable } from '../utils/inspectable';
import { getChainReturn, resolveExecuteTask } from '../utils/helpers';

export class Chain {
	public started = false;

	protected vk: VK;

	protected queue: APIRequest[] = [];

	/**
	 * Constructor
	 */
	public constructor(vk: VK) {
		this.vk = vk;
	}

	/**
	 * Returns custom tag
	 */
	public get [Symbol.toStringTag](): string {
		return this.constructor.name;
	}

	/**
	 * Adds method to queue
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public append(method: string, params: object): Promise<any> {
		if (this.started) {
			return Promise.reject(new VKError({
				message: 'Chain already started',
				code: 'ALREADY_STARTED'
			}));
		}

		const request = new APIRequest({
			method,
			params
		});

		this.queue.push(request);

		return request.promise;
	}

	/**
	 * Promise based
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public then(thenFn: Function, catchFn: Function): Promise<any[]> {
		// @ts-ignore
		return Promise.resolve(this.run()).then(thenFn, catchFn);
	}

	/**
	 * Starts the chain
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public async run(): Promise<{ response: any[]; errors: any[] }> {
		if (this.started) {
			throw new VKError({
				message: 'Chain already started',
				code: 'ALREADY_STARTED'
			});
		}

		this.started = true;

		const { queue } = this;

		let out: {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			response: any[];
			errors: ExecuteError[];
		} = {
			response: [],
			errors: []
		};

		if (queue.length === 0) {
			return out;
		}

		while (queue.length > 0) {
			const tasks = queue.splice(0, 25);
			const code = getChainReturn(tasks.map(String));

			try {
				const response = await this.vk.api.execute({ code });

				resolveExecuteTask(tasks, response);

				out = {
					response: [...out.response, ...response.response],
					errors: [...out.errors, ...response.errors]
				};
			} catch (error) {
				for (const task of tasks) {
					task.reject(error);
				}

				throw error;
			}
		}

		return out;
	}
}

inspectable(Chain, {
	// @ts-ignore
	serialize: ({ started, queue }) => ({
		started,
		queue
	})
});
