import { parseReference } from "./parse-reference";

const [, , url] = process.argv;

async function loadPage(url: string): Promise<string> {
  const response = await fetch(url);
  return response.text();
}

loadPage(url).then((html) => {
  process.stdout.write(JSON.stringify(parseReference(html), null, 2));
});
