import { expect, test, type Page } from "@playwright/test";
const tools=[
  ["cubic-bezier","bezier-duration","cubic-bezier-output"],
  ["css-gradient","gradient-kind","css-gradient-output"],
  ["svg-placeholder","placeholder-width","svg-placeholder-output"],
  ["path-batch","path-batch-input","path-batch-output"],
  ["color-palette","palette-base","color-palette-output"],
] as const;
async function enable(page:Page,id:string,input:string,locale:string){
  await page.goto("./"+locale+"/tools/"+id+"/");
  await expect(page.getByTestId("tool-disabled")).toBeVisible();
  await page.getByTestId("disabled-settings").click();
  const toggle=page.getByTestId("toggle-"+id);
  await expect(toggle).toHaveAttribute("aria-checked","false");
  await toggle.click();
  await page.getByTestId("settings-close").click();
  await expect(page.locator("#"+input)).toBeVisible();
  await expect(page.locator("#page-guide")).toHaveAttribute("data-tool",id);
}
for(const locale of ["ja","en","zh-CN","zh-TW","ko"]){
  test("five new design tools in "+locale,async({page})=>{
    for(const [id,input,output] of tools){
      await enable(page,id,input,locale);
      await expect(page.getByTestId(output)).toBeVisible();
      if(id==="svg-placeholder") await expect(page.getByTestId("svg-placeholder-preview")).toBeVisible();
    }
    await page.locator("#palette-base").fill("#FF0000");
    await page.locator("#palette-count").fill("3");
    await page.locator("#palette-harmony").selectOption("triadic");
    await expect(page.getByTestId("color-palette-output")).toContainText("#00FF00");
    await page.locator("#palette-base").fill("invalid");
    await expect(page.getByRole("alert")).toBeVisible();
    const geometry=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,width:document.documentElement.scrollWidth}));
    expect(geometry.width).toBeLessThanOrEqual(geometry.viewport+1);
  });
}
test("bezier, gradient, SVG and paths have live edits and invalid-state recovery",async({page})=>{
  await enable(page,"cubic-bezier","bezier-duration","en");
  await expect(page.getByTestId("cubic-bezier-output")).toContainText("cubic-bezier(");
  await page.getByLabel("x1").fill("1.2");
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByLabel("x1").fill("0.25");
  await expect(page.getByTestId("cubic-bezier-output")).toContainText("0.25");

  await enable(page,"css-gradient","gradient-kind","en");
  await expect(page.getByTestId("css-gradient-preview")).toBeVisible();
  await page.locator("#gradient-kind").selectOption("radial");
  await expect(page.getByTestId("css-gradient-output")).toContainText("radial-gradient(");

  await enable(page,"svg-placeholder","placeholder-width","en");
  await page.locator("#placeholder-label").fill("<script>bad</script>");
  await expect(page.getByTestId("svg-placeholder-output")).toContainText("&lt;script&gt;bad&lt;/script&gt;");
  await expect(page.getByTestId("svg-placeholder-preview")).toBeVisible();
  await page.locator("#placeholder-width").fill("99999");
  await expect(page.getByRole("alert")).toBeVisible();

  await enable(page,"path-batch","path-batch-input","en");
  await page.locator("#path-batch-input").fill("a/Report.txt\na/report.txt");
  await expect(page.getByTestId("path-batch-output").locator("tbody tr")).toHaveCount(2);
  await expect(page.getByTestId("path-batch-output")).toContainText("Duplicate");
});
test("new design tools never submit user content to network or storage",async({page})=>{
  const requests:Array<{url:string;method:string;body:string|null}>=[];
  page.on("request",r=>requests.push({url:r.url(),method:r.method(),body:r.postData()}));
  await enable(page,"path-batch","path-batch-input","en");
  const secret="PRIVATE_DESIGN_TEST_"+'x'.repeat(500);
  await page.locator("#path-batch-input").fill(secret+".txt");
  await expect(page.getByTestId("path-batch-output")).toContainText("PRIVATE_DESIGN_TEST");
  const saved=await page.evaluate(()=>({local:{...localStorage},session:{...sessionStorage},url:location.href}));
  expect(JSON.stringify(saved)).not.toContain(secret);
  expect(JSON.stringify(requests)).not.toContain(secret);
  expect(requests.every(r=>new URL(r.url).origin==="http://127.0.0.1:4173"&&r.method==="GET"&&r.body===null)).toBe(true);
});
