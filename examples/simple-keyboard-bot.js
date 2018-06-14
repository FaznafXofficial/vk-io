const { VK, Keyboard } = require('vk-io');

const vk = new VK();

vk.setOptions({
	token: process.env.TOKEN,
	apiMode: 'parallel_selected',
	webhookPath: '/webhook/secret-path'
});

const { updates } = vk;

// Skip outbox message and handle errors
updates.use(async (context, next) => {
	if (context.is('message') && context.isOutbox()) {
		return;
	}

	try {
		await next();
	} catch (error) {
		console.error('Error:', error);
	}
});

// Handle message payload
updates.use(async (context, next) => {
	if (context.is('message')) {
		const payload = context.getMessagePayload();

		context.state.command = payload && payload.command
			? payload.command
			: null;
	}

	await next();
});

const hearCommand = (name, conditions, handle) => {
	if (typeof handle !== 'function') {
		handle = conditions;
		conditions = [`/${name}`];
	}

	if (!Array.isArray(conditions)) {
		conditions = [conditions];
	}

	updates.hear(
		[
			(text, { state }) => (
				state.command === name
			),
			...conditions
		],
		handle
	);
};

hearCommand('start', async (context, next) => {
	context.state.command = 'help';

	await next();
});

hearCommand('help', async (context) => {
	await context.send({
		message: `
			My commands list

			/help - The help
			/time - The current date
			/cat - Cat photo
			/purr - Cat purring
			/reverse - Reverse text
		`,
		keyboard: Keyboard.keyboard([
			Keyboard.textButton({
				label: 'The help',
				payload: {
					command: 'help'
				}
			}),
			Keyboard.textButton({
				label: 'The current date',
				payload: {
					command: 'time'
				}
			}),
			[
				Keyboard.textButton({
					label: 'Cat photo',
					payload: {
						command: 'cat'
					},
					color: Keyboard.PRIMARY_COLOR
				}),
				Keyboard.textButton({
					label: 'Cat purring',
					payload: {
						command: 'purr'
					},
					color: Keyboard.PRIMARY_COLOR
				})
			]
		])
	});
});

hearCommand('cat', async (context) => {
	await Promise.all([
		context.send('Wait for the uploads awesome 😻'),

		context.sendPhoto('http://lorempixel.com/400/200/cats/')
	]);
});

hearCommand('time', ['/time', '/date'], async (context) => {
	await context.send(String(new Date()));
});

hearCommand('reverse', /^\/reverse (.+)/i, async (context) => {
	const text = context.$match[1];

	const reversed = text.split('').reverse().join('');

	await context.send(reversed);
});

const catsPurring = [
	'http://ronsen.org/purrfectsounds/purrs/trip.mp3',
	'http://ronsen.org/purrfectsounds/purrs/maja.mp3',
	'http://ronsen.org/purrfectsounds/purrs/chicken.mp3'
];

hearCommand('purr', async (context) => {
	const link = catsPurring[Math.floor(Math.random() * catsPurring.length)];

	await Promise.all([
		context.send('Wait for the uploads purring 😻'),

		context.sendVoice(link)
	]);
});

async function run() {
	if (process.env.UPDATES === 'webhook') {
		await vk.updates.startWebhook();

		console.log('Webhook server started');
	} else {
		await vk.updates.startPolling();

		console.log('Polling started');
	}
}

run().catch(console.error);
