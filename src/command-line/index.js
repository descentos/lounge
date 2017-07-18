"use strict";

global.log = require("../log.js");

const program = require("commander");
const Helper = require("../helper");

program.version(Helper.getVersion(), "-v, --version")
	.option("--home <path>", "path to configuration folder")
	.parseOptions(process.argv);

Helper.setHome(program.home || process.env.LOUNGE_HOME);

require("./start");
require("./config");
require("./list");
require("./add");
require("./remove");
require("./reset");
require("./edit");

program.parse(process.argv);

if (!program.args.length) {
	program.help();
}
