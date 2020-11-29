import { JSDOM } from 'jsdom';
import fs from 'fs';

(async () => {
  const dom = await JSDOM.fromURL('http://abyz.me.uk/rpi/pigpio/sif.html');

  const HTMLTableElement = dom.window.HTMLTableElement;

  const nextSiblingTable = (
    element: HTMLElement
  ): HTMLTableElement | undefined => {
    let elem = element.nextElementSibling;
    while (elem) {
      if (elem instanceof HTMLTableElement) {
        return elem;
      }

      elem = elem?.nextElementSibling;
    }
    return undefined;
  };
  const normalizeCommandName = (name: string): string => {
    if(name.endsWith("*")) {
        return name.slice(0,-1).trim();
    }
    return name.trim();
  };

  const getRequestCommand = () => {
    const request = dom.window.document.getElementById('Request')
      ?.parentElement;
    if (!request) {
      return;
    }
    const requestTable = nextSiblingTable(request);
    if (!requestTable) {
      return;
    }
    const tbody = requestTable.firstElementChild;
    if (!tbody) {
      return;
    }

    return Array.from(tbody.children)
      .map((t) => Array.from(t.children).map((e) => e.textContent ?? ''))
      .slice(1)
      .filter((e) => e[0] !== 'N/A')
      .map((e) => ({
        cmdName: e[0],
        cmdNo: Number(e[1]),
        p1: e[2],
        p2: e[3],
        p3: e[4],
        extension: e[5]?.split('\n'),
      }))
      .reduce(
        (prev, { cmdName, cmdNo, p1, p2, p3, extension }) => ({
          ...prev,
          [cmdName]: {
            cmdNo,
            p1,
            p2,
            p3,
            extension,
          },
        }),
        {}
      );
  };

  const getResponseCommand = () => {
    const request = dom.window.document.getElementById('Response')
      ?.parentElement;
    if (!request) {
      return;
    }
    const requestTable = nextSiblingTable(request);
    if (!requestTable) {
      return;
    }
    const tbody = requestTable.firstElementChild;
    if (!tbody) {
      return;
    }

    return Array.from(tbody.children)
      .map((t) => Array.from(t.children).map((e) => e.textContent ?? ''))
      .slice(1)
      .filter((e) => e[0] !== 'N/A')
      .map((e) => ({
        cmdName: normalizeCommandName(e[0]),
        cmdNo: Number(e[1]),
        p1: e[2],
        p2: e[3],
        res: e[4],
        extension: e[5]?.split('\n'),
      }))
      .reduce(
        (prev, { cmdName, cmdNo, p1, p2, res, extension }) => ({
          ...prev,
          [cmdName]: {
            cmdNo,
            p1,
            p2,
            res,
            extension,
          },
        }),
        {}
      );
  };

  const JsonAsConst = (value: unknown): string => {
    const json = JSON.stringify(value,undefined,2);

    return `//Do not edit this file. generated by getcommands.ts \nconst value = ${json} as const\nexport default value\n`;
  };
  fs.writeFileSync('RequestCommands.ts', JsonAsConst(getRequestCommand()));
  fs.writeFileSync('ResponseCommands.ts', JsonAsConst(getResponseCommand()));
})();