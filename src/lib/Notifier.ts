import { REMOTE_HOST } from "./constant";
import * as fs from "fs-extra";
import USER_HOME from "user-home";
import "isomorphic-fetch";

class Notifier {
  constructor(public opts) {
    for (const opt in opts) {
      if (opts.hasOwnProperty(opt)) {
        const val = opts[opt];
        this[opt] = val;
      }
    }
  }

  public async notify() {
    try {
      const res = await fetch(`${REMOTE_HOST}/api/notify`, {
        method: "POST",
        headers: {
          // Check what headers the API needs. A couple of usuals right below
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(this.opts)
      });
      if (!res.ok) {
        // throw new Error("Network response was not ok.");
        /* write local file */
        fs.writeFileSync(`${USER_HOME}/.mi-log`, JSON.stringify(this.opts), {
          flag: "a"
        });
      }
    } catch (err) {
      console.error("notify error", err.message);
      process.exit();
    }
  }
}

export default Notifier;
