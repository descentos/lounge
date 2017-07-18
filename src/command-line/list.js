"use strict";

const colors = require("colors/safe");
const program = require("commander");
const fs = require("fs");

program
	.command("list")
	.description("List all users")
	.action(function() {
		const Helper = require("../helper");

		if (!fs.existsSync(Helper.USERS_PATH)) {
			log.error(`${Helper.USERS_PATH} does not exist.`);
			return;
		}

		const ClientManager = require("../clientManager");

		var users = new ClientManager().getUsers();
		if (!users.length) {
			log.warn("No users found.");
		} else {
			log.info("Users:");
			for (var i = 0; i < users.length; i++) {
				log.info(`${i + 1}. ${colors.bold(users[i])}`);
			}
		}
	});
