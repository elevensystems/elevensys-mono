# Sprint Demo Rally Info Extraction

Use MCP tools to connect to Rally then leverage necessary Rally related tools to get the information of the given User Stories or Defects: [LIST_YOUR_IDS_HERE]

The output must be a JavaScript array named 'records' with the following structure for each item:
- id: Rally FormattedID (e.g., "US1234567")
- name: Story/Defect name/title  
- rallyLink: Full URL to the Rally item (format: https://rally1.rallydev.com/#/644875473405d/iterationstatus?detail=%2Fuserstory%2F[ObjectID]%2Fdeta…
- state: Current state (e.g., "Completed", "In-Progress", "Accepted")
- estimate: Story points or estimate hours (number)
- owner: Owner's full name (not ID)

Team owner mapping (Rally Owner ID -> Full Name):
- 632186963041 -> Bao Huynh
- 660712859191 -> Khoa Minh Nguyen
- 817514198011 -> Nam Hai Nguyen
- 832646835651 -> Nghia Le
- 644175737127 -> Trung TienHua

Required output format:
1. Include a comment block at the top with the Rally Owner ID to name mapping
2. Create a const named 'records' as an array of objects
3. Each object must follow this exact format:

const records = [
    {
        id: 'US1234567',
        name: '[Component] Description of the story',
        rallyLink: 'https://rally1.rallydev.com/#/644875473405d/iterationstatus?detail=%2Fuserstory%2F123456789%2Fdetai…,
        state: 'Completed',
        estimate: 3,
        owner: 'Bao Huynh',
    },
    // ... more items
];

Ensure all owner fields use the full names from the mapping above, not the Rally IDs.