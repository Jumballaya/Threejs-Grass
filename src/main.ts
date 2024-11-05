import { GrassApplication } from "./GrassApplication";
import "./style.css";

function main() {
  const app = new GrassApplication();

  let time = Date.now();
  const loop = () => {
    const curTime = Date.now();
    const deltaTime = (curTime - time) / 1000;
    time = curTime;
    app.step(deltaTime);
    requestAnimationFrame(loop);
  };
  loop();
}
main();
