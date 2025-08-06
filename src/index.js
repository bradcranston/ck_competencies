
window.loadTable = (skillData, contactData, scoreData) => {

const tabledata = createTabulatorData(JSON.parse(skillData), JSON.parse(contactData), JSON.parse(scoreData))

//console.log(tabledata);

const table = new Tabulator("#example-table", {
  data:tabledata.data, //assign data to table
 // autoColumns:true, //create columns from data field names
  layout:"fitColumns",
  movableRows:true,
  groupBy:"Area",
  height:"500",
  columns:tabledata.columns
});




function createTabulatorData(skillData, contactData, scoreData) {
  // Step 1: Create the table columns (first column is 'Skill', others are contacts)
  const columns = [
      { title: "Skill", field: "Skill", width: 300, hozAlign: "left" }
  ];

  contactData.forEach(contact => {
      columns.push({ title: contact.fieldData.contact, field: contact.fieldData.contact_id, hozAlign: "center", editor:"list", editorParams:{values:{"N":"N", "1":"1", "2":"2", "3":"3", "-":"-"}} });
  });

  // Step 2: Create the table rows with skill names and corresponding scores
  const tableData = [];

  skillData.forEach(skill => {
      // Initialize row with skill name
      const row = {
          Skill: skill.fieldData.Skill,
          Area: skill.fieldData.Area,
          id: skill.fieldData.__ID
      };

      // Fill in the scores for each contact
      contactData.forEach(contact => {
          const scoreEntry = scoreData.find(score => score.fieldData.Skill_ID === skill.fieldData.__ID && score.fieldData.Contact_ID === contact.fieldData.contact_id);
          row[contact.fieldData.contact_id] = scoreEntry ? scoreEntry.fieldData.Data : "-"; // Use "-" if no score is found
        });
        
        tableData.push(row);
  });

  // Step 3: Return the table structure with columns and data
  return { columns, data: tableData };
 

}

table.on("cellEdited", function(cell){
  // Triggered when a cell's value has been changed
  var conId = cell.getField();
  var skillId = cell.getData().id;
  var value = cell.getValue();
  const result = {"conId":conId,"skillId":skillId,"value":value,"mode":'updateScore'};

  // Log the details in the console
  console.log(result);

  runScript(JSON.stringify(result));
});

runScript = function (param) {
    FileMaker.PerformScriptWithOption("Manage: Competencies", param, 0);
}

};