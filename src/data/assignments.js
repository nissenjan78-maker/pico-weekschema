// src/data/assignments.js
// blocks: 'morning' | 'noon' | 'evening' | 'all'  (of array ['morning','evening'])

export const ASSIGNMENTS = {
  leon: [
    { taskId: "opstaan",       blocks: "morning" },
    { taskId: "aankleden",     blocks: "morning" },
    { taskId: "ontbijt",       blocks: "morning" },
    { taskId: "tandenpoetsen", blocks: ["morning","evening"] },
    { taskId: "school",        blocks: "noon" },
    { taskId: "spelen",        blocks: "noon" },
    { taskId: "tablet",        blocks: "noon" },
    { taskId: "douchen",       blocks: "evening" },
    { taskId: "pyjama",        blocks: "evening" },
    { taskId: "lezen",         blocks: "evening" },
    { taskId: "naarbed",       blocks: "evening" },
  ],
  lina: [
    { taskId: "opstaan",       blocks: "morning" },
    { taskId: "aankleden",     blocks: "morning" },
    { taskId: "ontbijt",       blocks: "morning" },
    { taskId: "tandenpoetsen", blocks: ["morning","evening"] },
    { taskId: "school",        blocks: "noon" },
    { taskId: "spelen",        blocks: "noon" },
    { taskId: "tablet",        blocks: "noon" },
    { taskId: "douchen",       blocks: "evening" },
    { taskId: "pyjama",        blocks: "evening" },
    { taskId: "lezen",         blocks: "evening" },
    { taskId: "naarbed",       blocks: "evening" },
  ],
};
