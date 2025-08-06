
window.loadTable = (skillData, contactData, scoreData) => {

// Store data globally for use in other functions
window.skillData = skillData;
window.contactData = contactData;
window.scoreData = scoreData;

const tabledata = createTabulatorData(JSON.parse(skillData), JSON.parse(contactData), JSON.parse(scoreData))

// First, let's try without groupFooter to see if the issue is specific to that
const table = new Tabulator("#example-table", {
  data:tabledata.data, //assign data to table
 // autoColumns:true, //create columns from data field names
  layout:"fitColumns",
  movableRows:true,
  groupBy:"Area",
  height:"500",
  columns:tabledata.columns,
  groupHeader: function(value, count){
    return value + " (" + count + " skills)";
  },
  // Temporarily remove groupFooter to test
  groupToggleElement: "header",
  groupStartOpen: true,
  renderComplete: function(){
    // Only call after render is complete - this should be sufficient
    setTimeout(() => {
      addManualGroupFooters();
    }, 500);
  },
  columnResized: function(){
    // Only recreate footers if column widths change
    setTimeout(() => {
      addManualGroupFooters();
    }, 300);
  },
  layoutColumnsOnNewData: true
});

// Single backup method - add footers after a reasonable delay
setTimeout(() => {
  addManualGroupFooters();
}, 1500);

// Add window resize listener to handle webviewer resizing (debounced)
let resizeTimeout = null;
window.addEventListener('resize', function() {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }
  resizeTimeout = setTimeout(() => {
    resizeTimeout = null;
    addManualGroupFooters();
  }, 500);
});

// Also listen for any mutations to the table that might remove our footers
const tableObserver = new MutationObserver(function(mutations) {
  let shouldReaddFooters = false;
  mutations.forEach(function(mutation) {
    // Check if any of our manual footers were removed by something OTHER than our own function
    mutation.removedNodes.forEach(function(node) {
      if (node.classList && node.classList.contains('manual-group-footer')) {
        // Only trigger if we don't currently have a pending timeout (to avoid infinite loops)
        if (!addFootersTimeout) {
          shouldReaddFooters = true;
        }
      }
    });
  });
  
  if (shouldReaddFooters) {
    // Use debouncing to prevent rapid fire calls
    addFootersTimeout = setTimeout(() => {
      addFootersTimeout = null;
      addManualGroupFooters();
    }, 500); // Increased delay to prevent rapid fire
  }
});

// Start observing the table element once it's created
setTimeout(() => {
  const tableElement = document.querySelector('#example-table');
  if (tableElement) {
    tableObserver.observe(tableElement, {
      childList: true,
      subtree: true
    });
  }
}, 1000);

// Global variables for modal state
window.currentGroupName = '';
window.currentContactName = '';
window.currentContactId = '';
window.currentMode = '';
window.currentUser = ''; // Add current user tracking

// Function to set the current user (can be called from FileMaker)
window.setCurrentUser = function(userName) {
  window.currentUser = userName;
  console.log('Current user set to:', userName);
};

// Modal functions
window.openNotesModal = function(groupName, contactName, contactId, mode) {
  console.log('openNotesModal called with:', { groupName, contactName, contactId, mode });
  
  window.currentGroupName = groupName;
  window.currentContactName = contactName;
  window.currentContactId = contactId;
  window.currentMode = mode;
  
  const modal = document.getElementById('notesModal');
  const modalTitle = document.getElementById('modalTitle');
  const noteTextarea = document.getElementById('noteTextarea');
  const noteDisplay = document.getElementById('noteDisplay');
  const saveBtn = document.getElementById('saveNoteBtn');
  
  console.log('Modal elements found:', { 
    modal: !!modal, 
    modalTitle: !!modalTitle, 
    noteTextarea: !!noteTextarea,
    noteDisplay: !!noteDisplay,
    saveBtn: !!saveBtn 
  });
  
  if (!modal) {
    console.error('Modal element not found!');
    return;
  }
  
  // Ensure the close button works
  const closeBtn = modal.querySelector('.close');
  if (closeBtn) {
    closeBtn.onclick = function() {
      console.log('Close button clicked');
      closeNotesModal();
    };
  }
  
  if (mode === 'add') {
    modalTitle.textContent = `Add Note - ${groupName} / ${contactName}`;
    noteTextarea.value = '';
    noteTextarea.style.display = 'block';
    noteDisplay.style.display = 'none';
    saveBtn.style.display = 'inline-block';
    saveBtn.textContent = 'Save Note';
  } else {
    modalTitle.textContent = `View Notes - ${groupName} / ${contactName}`;
    noteTextarea.style.display = 'none';
    noteDisplay.style.display = 'block';
    noteDisplay.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Loading notes...</div>';
    saveBtn.style.display = 'none';
    
    // Load existing notes (you'll need to implement this based on your data structure)
    loadExistingNotes(groupName, contactId);
  }
  
  modal.style.display = 'block';
  console.log('Modal should now be visible');
};

window.closeNotesModal = function() {
  console.log('closeNotesModal called');
  const modal = document.getElementById('notesModal');
  if (modal) {
    modal.style.display = 'none';
    console.log('Modal closed');
  } else {
    console.error('Modal element not found when trying to close!');
  }
};

window.saveNote = function() {
  console.log('saveNote called');
  const noteText = document.getElementById('noteTextarea').value;
  
  if (noteText.trim() === '') {
    alert('Please enter a note before saving.');
    return;
  }
  
  const result = {
    "groupName": window.currentGroupName,
    "contactId": window.currentContactId,
    "contactName": window.currentContactName,
    "noteText": noteText,
    "timestamp": new Date().toISOString(),
    "author": window.currentUser || "Unknown User", // Add author field
    "mode": 'saveNote'
  };
  
  console.log('Saving note:', result);
  
  // Check if FileMaker runScript is available
  if (typeof runScript === 'function') {
    runScript(JSON.stringify(result));
  } else if (typeof FileMaker !== 'undefined' && typeof FileMaker.PerformScriptWithOption === 'function') {
    FileMaker.PerformScriptWithOption("Manage: Competencies", JSON.stringify(result), 0);
  } else {
    console.error('FileMaker runScript function not available');
    alert('Note saved locally (FileMaker integration not available)');
  }
  
  closeNotesModal();
};

window.loadExistingNotes = function(groupName, contactId) {
  // This function should load existing notes for the group/contact combination
  // You'll need to implement this based on your FileMaker database structure
  const result = {
    "groupName": groupName,
    "contactId": contactId,
    "mode": 'loadNotes'
  };
  
  console.log('Loading notes for:', result);
  runScript(JSON.stringify(result));
};

// Function to receive notes data from FileMaker
window.displayNotes = function(notesData) {
  const noteDisplay = document.getElementById('noteDisplay');
  try {
    const notes = JSON.parse(notesData);
    if (notes && notes.length > 0) {
      // Sort notes by timestamp if available (newest first)
      notes.sort((a, b) => {
        if (a.timestamp && b.timestamp) {
          return new Date(b.timestamp) - new Date(a.timestamp);
        }
        return 0;
      });
      
      // Create a card-based display
      let notesHTML = '';
      
      // Add a summary header
      notesHTML += `<div style="margin-bottom: 20px; padding: 12px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">`;
      notesHTML += `<strong>📝 ${notes.length} note${notes.length === 1 ? '' : 's'} found for ${window.currentContactName} in ${window.currentGroupName}</strong>`;
      notesHTML += `</div>`;
      
      // Create cards for each note
      notes.forEach((note, index) => {
        notesHTML += `<div style="margin-bottom: 16px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1px solid #e0e0e0; overflow: hidden;">`;
        
        // Card header
        notesHTML += `<div style="background: #f5f5f5; padding: 10px 16px; border-bottom: 1px solid #e0e0e0;">`;
        notesHTML += `<div style="display: flex; justify-content: space-between; align-items: center;">`;
        notesHTML += `<span style="font-weight: 600; color: #1976d2;">Note ${index + 1}</span>`;
        
        if (note.timestamp) {
          const date = new Date(note.timestamp);
          const formattedDate = date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          notesHTML += `<span style="font-size: 12px; color: #666;">${formattedDate}</span>`;
        }
        notesHTML += `</div>`;
        
        // Add author if available
        if (note.author) {
          notesHTML += `<div style="margin-top: 4px; font-size: 13px; color: #757575;">`;
          notesHTML += `<span style="display: inline-flex; align-items: center;"><span style="margin-right: 4px;">👤</span> ${note.author}</span>`;
          notesHTML += `</div>`;
        }
        notesHTML += `</div>`;
        
        // Card content
        notesHTML += `<div style="padding: 16px;">`;
        
        // Format the note text with proper line breaks
        const formattedText = note.noteText
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>');
        
        notesHTML += `<div style="line-height: 1.5; color: #333;">${formattedText}</div>`;
        notesHTML += `</div>`;
        
        notesHTML += `</div>`;
      });
      
      noteDisplay.innerHTML = notesHTML;
      
    } else {
      noteDisplay.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
          <h3 style="margin: 0 0 8px 0; color: #333;">No notes found</h3>
          <p style="margin: 0; color: #666;">No notes found for ${window.currentContactName} in ${window.currentGroupName}.</p>
          <p style="margin: 8px 0 0 0; color: #999; font-size: 14px;">💡 Click "Add Note" to create the first note for this combination.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error parsing notes data:', error);
    noteDisplay.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #d32f2f;">
        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
        <h3 style="margin: 0 0 8px 0; color: #d32f2f;">Error loading notes</h3>
        <p style="margin: 0; color: #666;">Please check the console for details.</p>
      </div>
    `;
  }
};

// Add a debounce mechanism to prevent infinite loops
let addFootersTimeout = null;

// Manual function to add group footers if Tabulator's built-in groupFooter doesn't work
function addManualGroupFooters() {
  try {
    // Clear any pending timeout to debounce rapid calls
    if (addFootersTimeout) {
      clearTimeout(addFootersTimeout);
    }
    
    // Check if we have the required data
    if (!window.skillData || !window.contactData || !window.scoreData) {
      return;
    }
    
    // Find all group elements in the Tabulator table
    const tableElement = document.querySelector('#example-table .tabulator-table');
    if (!tableElement) {
      return;
    }
    
    // Find all group containers
    const groupElements = tableElement.querySelectorAll('.tabulator-group');
    
    if (groupElements.length === 0) {
      return;
    }
    
    // Check if we already have the right number of footers - if so, don't recreate them
    const existingFooters = document.querySelectorAll('.manual-group-footer');
    if (existingFooters.length === groupElements.length) {
      // Footers already exist for all groups, don't recreate them
      console.log('Footers already exist (' + existingFooters.length + ' of ' + groupElements.length + '), skipping recreation');
      return;
    }
    
    // Only remove existing footers if we need to recreate them
    console.log('Creating footers: existing=' + existingFooters.length + ', needed=' + groupElements.length);
    existingFooters.forEach(footer => footer.remove());
    
    // Get the actual column widths from the table header
    const headerCells = document.querySelectorAll('#example-table .tabulator-headers .tabulator-col');
    const columnWidths = Array.from(headerCells).map(cell => {
      return cell.getBoundingClientRect().width;
    });
    
    // Get unique area names from the table data to match with group elements
    const tabledata = createTabulatorData(JSON.parse(window.skillData), JSON.parse(window.contactData), JSON.parse(window.scoreData));
    const uniqueAreas = [...new Set(tabledata.data.map(row => row.Area))];
    
    groupElements.forEach((groupElement, index) => {
      // Use the area name from our data instead of parsing DOM
      const groupName = uniqueAreas[index] || `Group ${index}`;
      
      // Create footer HTML with columns matching the table structure
      const contacts = JSON.parse(window.contactData);
      
      // Start with the skill column using actual width
      const skillColumnWidth = columnWidths[0] || 300;
      let footerHTML = `<div class="tabulator-cell" style="width: ${skillColumnWidth}px; min-width: ${skillColumnWidth}px; max-width: ${skillColumnWidth}px; padding: 8px; text-align: left; font-weight: bold; box-sizing: border-box; overflow: hidden;">Notes:</div>`;
      
      // Add a column for each contact with their buttons, using actual column widths
      contacts.forEach((contact, contactIndex) => {
        const columnWidth = columnWidths[contactIndex + 1] || 150; // +1 because first column is skills
        const contactName = contact.fieldData.contact.replace(/'/g, "\\'"); // Escape single quotes
        const contactId = contact.fieldData.contact_id;
        
        footerHTML += `
          <div class="tabulator-cell" style="width: ${columnWidth}px; min-width: ${columnWidth}px; max-width: ${columnWidth}px; padding: 4px; text-align: center; box-sizing: border-box; overflow: hidden;">
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <button title="Add note for ${contactName}" 
                      type="button"
                      style="font-size: 10px; padding: 2px 4px; margin: 1px; white-space: nowrap; width: calc(100% - 6px); cursor: pointer;">
                Add Note
              </button>
              <button title="View notes for ${contactName}" 
                      type="button"
                      style="font-size: 10px; padding: 2px 4px; margin: 1px; white-space: nowrap; width: calc(100% - 6px); cursor: pointer;">
                View Notes
              </button>
            </div>
          </div>
        `;
      });
      
      // Create a footer element that looks like a table row
      const footerDiv = document.createElement('div');
      footerDiv.className = 'manual-group-footer tabulator-row';
      footerDiv.setAttribute('data-group', index);
      footerDiv.style.display = 'flex';
      footerDiv.style.backgroundColor = '#f5f5f5';
      footerDiv.style.borderTop = '1px solid #ddd';
      footerDiv.style.borderBottom = '2px solid #ccc';
      footerDiv.style.width = '100%';
      footerDiv.innerHTML = footerHTML;
      
      // Add event delegation for button clicks (more reliable than inline onclick)
      footerDiv.addEventListener('click', function(e) {
        const button = e.target.closest('button');
        if (!button) return;
        
        console.log('Button clicked via event delegation:', button.textContent.trim());
        
        // Extract data from button attributes or text
        const buttonText = button.textContent.trim();
        const titleAttr = button.getAttribute('title');
        
        if (titleAttr && window.openNotesModal) {
          // Parse contact name from title: "Add note for ContactName" or "View notes for ContactName"
          const match = titleAttr.match(/for (.+)$/);
          if (match) {
            const contactName = match[1];
            const mode = buttonText.toLowerCase().includes('add') ? 'add' : 'view';
            
            // Find the contact ID
            const contacts = JSON.parse(window.contactData);
            const contact = contacts.find(c => c.fieldData.contact === contactName);
            const contactId = contact ? contact.fieldData.contact_id : '';
            
            console.log('Opening modal:', { groupName, contactName, contactId, mode });
            window.openNotesModal(groupName, contactName, contactId, mode);
          }
        }
      });
      
      // Insert the footer after the group's last row
      // Find all rows that belong to this group
      let currentElement = groupElement.nextElementSibling;
      let lastRowInGroup = groupElement;
      
      // Navigate through rows until we find the next group or reach the end
      while (currentElement && !currentElement.classList.contains('tabulator-group')) {
        if (currentElement.classList.contains('tabulator-row')) {
          lastRowInGroup = currentElement;
        }
        currentElement = currentElement.nextElementSibling;
      }
      
      // Insert after the last row in this group
      lastRowInGroup.parentNode.insertBefore(footerDiv, lastRowInGroup.nextSibling);
    });
    
  } catch (error) {
    console.error('Error adding manual group footers:', error);
  }
}

// Make sure the function is available globally for FileMaker
window.addManualGroupFooters = addManualGroupFooters;

// Close modal when clicking outside of it
window.onclick = function(event) {
  const modal = document.getElementById('notesModal');
  if (event.target === modal) {
    closeNotesModal();
  }
};

// Close modal when clicking the X
document.addEventListener('DOMContentLoaded', function() {
  const closeBtn = document.querySelector('.close');
  if (closeBtn) {
    closeBtn.onclick = closeNotesModal;
  }
});

// Close modal when clicking the X
document.addEventListener('DOMContentLoaded', function() {
  const closeBtn = document.querySelector('.close');
  if (closeBtn) {
    closeBtn.onclick = closeNotesModal;
  }
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
  const conId = cell.getField();
  const skillId = cell.getData().id;
  const value = cell.getValue();
  const result = {"conId":conId,"skillId":skillId,"value":value,"mode":'updateScore'};

  runScript(JSON.stringify(result));
});

runScript = function (param) {
    FileMaker.PerformScriptWithOption("Manage: Competencies", param, 0);
}

// Test function to manually test the modal
window.testModal = function() {
  openNotesModal('Test Group', 'Test Contact', 'test_id', 'add');
};

// Test function to load sample data and test grouping
window.testTableWithData = function() {
  const sampleSkillData = JSON.stringify([
    { fieldData: { Skill: "JavaScript", Area: "Technical Skills", __ID: "1" } },
    { fieldData: { Skill: "HTML/CSS", Area: "Technical Skills", __ID: "2" } },
    { fieldData: { Skill: "Communication", Area: "Soft Skills", __ID: "3" } },
    { fieldData: { Skill: "Leadership", Area: "Soft Skills", __ID: "4" } },
    { fieldData: { Skill: "Project Management", Area: "Management Skills", __ID: "5" } }
  ]);
  
  const sampleContactData = JSON.stringify([
    { fieldData: { contact: "John Doe", contact_id: "contact_1" } },
    { fieldData: { contact: "Jane Smith", contact_id: "contact_2" } }
  ]);
  
  const sampleScoreData = JSON.stringify([
    { fieldData: { Skill_ID: "1", Contact_ID: "contact_1", Data: "2" } },
    { fieldData: { Skill_ID: "1", Contact_ID: "contact_2", Data: "3" } },
    { fieldData: { Skill_ID: "2", Contact_ID: "contact_1", Data: "3" } },
    { fieldData: { Skill_ID: "2", Contact_ID: "contact_2", Data: "2" } },
    { fieldData: { Skill_ID: "3", Contact_ID: "contact_1", Data: "2" } },
    { fieldData: { Skill_ID: "3", Contact_ID: "contact_2", Data: "3" } },
    { fieldData: { Skill_ID: "4", Contact_ID: "contact_1", Data: "1" } },
    { fieldData: { Skill_ID: "4", Contact_ID: "contact_2", Data: "2" } },
    { fieldData: { Skill_ID: "5", Contact_ID: "contact_1", Data: "3" } },
    { fieldData: { Skill_ID: "5", Contact_ID: "contact_2", Data: "2" } }
  ]);
  
  // Call loadTable with sample data
  loadTable(sampleSkillData, sampleContactData, sampleScoreData);
};

// Add test button to the page for debugging
window.addEventListener('DOMContentLoaded', function() {
  const testButton = document.createElement('button');
  testButton.textContent = 'Test Modal';
  testButton.onclick = testModal;
  testButton.style.position = 'fixed';
  testButton.style.top = '10px';
  testButton.style.right = '10px';
  testButton.style.zIndex = '9999';
  document.body.appendChild(testButton);
  
  const testDataButton = document.createElement('button');
  testDataButton.textContent = 'Load Test Data';
  testDataButton.onclick = testTableWithData;
  testDataButton.style.position = 'fixed';
  testDataButton.style.top = '50px';
  testDataButton.style.right = '10px';
  testDataButton.style.zIndex = '9999';
  document.body.appendChild(testDataButton);
});

};