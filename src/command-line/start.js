"use strict";

const colors = require("colors/safe");
const fs = require("fs");
const fsextra = require("fs-extra");
const path = require("path");
const program = require("commander");
const Helper = require("../helper");

program
	.command("start")
	.option("-H, --host <ip>", "set the IP address or hostname for the web server to listen on")
	.option("-P, --port <port>", "set the port to listen on")
	.option("-B, --bind <ip>", "set the local IP to bind to for outgoing connections")
	.option("    --public", "start in public mode")
	.option("    --private", "start in private mode")
	.option("    --skip-setup", "skip configuration questions")
	.description("Start the server")
	.action(function(options) {
		if (options.public) {
			Helper.config.public = true;
		} else if (options.private) {
			Helper.config.public = false;
		}

		Helper.config.host = options.host || Helper.config.host;
		Helper.config.port = options.port || Helper.config.port;
		Helper.config.bind = options.bind || Helper.config.bind;

		initalizeConfig(options.skipSetup, startServer);
	});

function initalizeConfig(skipSetup, callback) {
	fsextra.ensureDirSync(Helper.USERS_PATH);

	if (fs.existsSync(Helper.CONFIG_PATH)) {
		return callback();
	}

	let config = fs.readFileSync(path.join(
		__dirname,
		"..",
		"..",
		"defaults",
		"config.js"
	), "utf8");

	if (skipSetup) {
		log.info("Skipping setup and using default config.");

		writeConfig(config, callback);
		return;
	}

	log.info("We are now going to configure The Lounge.");

	log.prompt({
		text: "What port would you like The Lounge to run on?",
		default: 9000
	}, (a, port) => {
		port = parseInt(port, 10) || 9000;
		config = config.replace("port: 9000,", `port: ${port},`);
		Helper.config.port = port;

		console.log("");

		log.info("The Lounge has two modes, public and private.");
		log.info("In public mode, anyone can use the instance and connect to IRC. All IRC connections are closed when the page is closed.");

		console.log("");

		log.info(`In private mode, user account is required, which can be created with ${colors.bold("lounge add <name>")} command.`);
		log.info("IRC connections are kept alive for all users even when the page is closed.");
		log.prompt({
			text: "Enable user authentication?",
			default: "yes"
		}, (b, mode) => {
			mode = mode.charAt(0).toLowerCase() === "y";

			Helper.config.public = !mode;

			if (!mode) {
				writeConfig(config, callback);
				return;
			}

			config = config.replace("public: true,", "public: false,");

			console.log("");

			log.info("You chose private instance, now we are going to create the first user.");
			log.prompt({
				text: "Enter username:"
			}, function(c, username) {
				if (!username) {
					log.error("Username cannot be empty.");
					return;
				}

				const add = require("./add");
				add.prompt(username, () => {
					writeConfig(config, callback);
				});
			});
		});
	});
}

function writeConfig(config, callback) {
	if (fs.existsSync(Helper.CONFIG_PATH)) {
		return callback();
	}

	fsextra.ensureDirSync(Helper.HOME);
	fs.chmodSync(Helper.HOME, "0700");
	fs.writeFileSync(Helper.CONFIG_PATH, config);

	console.log("");

	log.info(`Configuration file created at ${colors.green(Helper.CONFIG_PATH)}`);
	log.info("This configuration file has a lot more options, you should check it out and configure The Lounge for your needs!");

	console.log("");

	callback();
}

function startServer() {
	const ClientManager = require("../clientManager");
	const users = new ClientManager().getUsers();
	const server = require("../server");

	if (!Helper.config.public && !users.length && !Helper.config.ldap.enable) {
		log.warn("No users found.");
		log.info(`Create a new user with ${colors.bold("lounge add <name>")}.`);

		return;
	}

	server();
}
