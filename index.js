const { spawn, execFile } = require("child_process");

let backend = undefined;
let frontend = undefined;

module.exports = hermione => {
  hermione.on(hermione.events.RUNNER_START, () => {
    console.log("RUNNER_START");

    return Promise.all([
      new Promise(resolve => {
        backend = spawn(process.platform === "win32" ? "npm.cmd" : "npm", [
          "run",
          "start:backend_stub"
        ]);

        console.log(`backend pid: ${backend.pid}`);

        backend.stdout.on("data", data => {
          console.log(`onDataBackend: ${data}`);
          if (data.indexOf("Serving files from") !== -1) {
            resolve();
          }
        });

        backend.stderr.on("data", data => {
          console.log(`onErrorBackend: ${data}`);
        });

        backend.on("exit", data => {
          console.log(`onExitBackend: ${data}`);
        });
      }),
      new Promise(resolve => {
        frontend = spawn("npm.cmd", ["run", "start:ui"]);

        console.log(`frontend pid: ${frontend.pid}`);
        frontend.stdout.on("data", data => {
          console.log(`onDataFrontend: ${data}`);
          if (data.indexOf("Compiled successfully") !== -1) {
            resolve();
          }
        });

        frontend.stderr.on("data", data => {
          console.log(`onErrorFrontend: ${data}`);
        });

        frontend.on("exit", data => {
          console.log(`onExitFrontend: ${data}`);
        });
      })
    ]);
  });

  hermione.on(hermione.events.RUNNER_END, () => {
    console.log("RUNNER_END");
    return Promise.all([
      new Promise(resolve => {
        if (process.platform === "win32") {
          execFile(
            "taskkill",
            ["/T", "/f", "/PID", backend.pid],
            (err, out) => {
              if (err) {
                console.log(`backendKillErr: ${err}`);
              } else {
                console.log(`backendKillOut: ${out}`);
              }
              resolve();
            }
          );
        } else {
          backend.kill("SIGKILL");
          resolve();
        }
      }),
      new Promise(resolve => {
        if (process.platform === "win32") {
          execFile(
            "taskkill",
            ["/T", "/f", "/PID", frontend.pid],
            (err, out) => {
              if (err) {
                console.log(`frontendKillErr: ${err}`);
              } else {
                console.log(`frontendKillOut: ${out}`);
              }
              resolve();
            }
          );
        } else {
          frontend.kill("SIGKILL");
          resolve();
        }
      })
    ]);
  });
};
