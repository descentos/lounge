"use strict";

const colors = require("colors/safe");
const program = require("commander");
const fs = require("fs");

program
	.command("reset <name>")
	.description("Reset user password")
	.action(function(name) {
		const Helper = require("../helper");

		if (!fs.existsSync(Helper.USERS_PATH)) {
			log.error(`${Helper.USERS_PATH} does not exist.`);
			return;
		}

		const ClientManager = require("../clientManager");

		var users = new ClientManager().getUsers();
		if (users.indexOf(name) === -1) {
			log.error(`User ${colors.bold(name)} does not exist.`);
			return;
		}
		var file = Helper.getUserConfigPath(name);
		var user = require(file);
		log.prompt({
			text: "Enter new password:",
			silent: true
		}, function(err, password) {
			if (err) {
				return;
			}
			user.password = Helper.password.hash(password);
			user.token = null; // Will be regenerated when the user is loaded
			fs.writeFileSync(
				file,
				JSON.stringify(user, null, "\t")
			);
			log.info(`Successfully reset password for ${colors.bold(name)}.`);
		});
	});
