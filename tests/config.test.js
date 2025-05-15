import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import { loadConfig, DEFAULT_CONFIG } from "../src/config.js";

describe("loadConfig", () => {
  const filePathJson = path.resolve(process.cwd(), "__testrc.json");
  const filePathYaml = path.resolve(process.cwd(), "__testrc.yaml");
  const filePathYml = path.resolve(process.cwd(), "__testrc.yml");

  afterEach(() => {
    [filePathJson, filePathYaml, filePathYml].forEach((file) => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
  });

  it("should return default config when no config file exists", async () => {
    const config = await loadConfig();
    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it("should load and merge JSON configuration file", async () => {
    const customConfig = {
      branch: { main: "custom-main" },
      remote: { name: "custom-remote" },
    };
    fs.writeFileSync(filePathJson, JSON.stringify(customConfig), "utf8");
    const config = await loadConfig("__testrc.json");
    expect(config.branch.main).toBe("custom-main");
    expect(config.remote.name).toBe("custom-remote");
    expect(config.clean.force).toBe(DEFAULT_CONFIG.clean.force);
  });

  it("should load and merge YAML configuration file", async () => {
    const yamlContent =
      "branch:\n  main: custom-main\nremote:\n  name: custom-remote\n";
    fs.writeFileSync(filePathYaml, yamlContent, "utf8");
    const config = await loadConfig("__testrc.yaml");
    expect(config.branch.main).toBe("custom-main");
    expect(config.remote.name).toBe("custom-remote");
    expect(config.clean.force).toBe(DEFAULT_CONFIG.clean.force);
  });

  it("should handle invalid JSON configuration file gracefully", async () => {
    fs.writeFileSync(filePathJson, "{invalid json}", "utf8");
    const config = await loadConfig("__testrc.json");
    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it("should handle invalid YAML configuration file gracefully", async () => {
    fs.writeFileSync(filePathYaml, "invalid: [yaml", "utf8");
    const config = await loadConfig("__testrc.yaml");
    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it("should validate and apply default values for missing keys", async () => {
    const partialConfig = { branch: { develop: "custom-develop" } };
    fs.writeFileSync(filePathJson, JSON.stringify(partialConfig), "utf8");
    const config = await loadConfig("__testrc.json");
    expect(config.branch.main).toBe(DEFAULT_CONFIG.branch.main);
    expect(config.branch.develop).toBe("custom-develop");
    expect(config.remote.name).toBe(DEFAULT_CONFIG.remote.name);
  });
});
