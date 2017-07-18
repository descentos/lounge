"use strict";

const colors = require("colors/safe");
const program = require("commander");
const fs = require("fs");

program
	.command("remove <name>")
	.description("Remove an existing user")
	.action(function(name) {
		const Helper = require("../helper");

		if (!fs.existsSync(Helper.USERS_PATH)) {
			log.error(`${Helper.USERS_PATH} does not exist.`);
			return;
		}

		const ClientManager = require("../clientManager");

		var manager = new ClientManager();
		if (manager.removeUser(name)) {
			log.info(`User ${colors.bold(name)} removed.`);
		} else {
			log.error(`User ${colors.bold(name)} does not exist.`);
		}
	});
