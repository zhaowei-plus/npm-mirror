const execa = require("execa");

export default async () => {
	let name;
	let email;
	try {
		name = await execa.stdout("git", ["config", "--get", "user.name"]);
		email = await execa.stdout("git", ["config", "--get", "user.email"]);
	} catch (e) {}
	name = name && name.toString().trim();
	email = email && " <" + email.toString().trim() + ">";
	return { name, email };
};
