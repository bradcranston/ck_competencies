// Global data storage
window.skillData = null;
window.contactData = null;
window.scoreData = null;
window.currentUser = "Current User";
window.currentDate = "Current Date";
window.selectedLevels = ['BEGINNING', 'DEVELOPING', 'PROFICIENT', 'ADVANCED'];

// Global variables for modal state
window.currentGroupName = '';
window.currentContactName = '';
window.currentContactId = '';
window.currentMode = '';

// Global variables for score modal state
window.currentSkillName = '';
window.currentSkillId = '';
window.currentScoreContactId = '';
window.currentScoreContactName = '';

// Main function called from FileMaker to load the table
window.loadTable = (skillData, contactData, scoreData, user, date) => {
  console.log('loadTable called with user:', user);
  
  // Store data globally
  window.skillData = skillData;
  window.contactData = contactData;
  window.scoreData = scoreData;
  window.currentUser = user || "Current User";
  window.currentDate = date || "Current Date";

  console.log('window.currentUser set to:', window.currentUser);
  
  // Parse the data
  const skills = JSON.parse(skillData);
  const contacts = JSON.parse(contactData);
  const scores = JSON.parse(scoreData);
  
  // Create the table
  createTable(skills, contacts, scores);
};

// Helper function to get level colors
window.getLevelColor = function(level) {
  const levelColors = {
    'BEGINNING': '#e8f5e8',     // Light green
    'DEVELOPING': '#fff3cd',    // Light yellow  
    'PROFICIENT': '#cce5ff',    // Light blue
    'ADVANCED': '#f8d7da'       // Light red
  };
  return levelColors[level] || '#ffffff';
};

// Helper function to get level text colors
window.getLevelTextColor = function(level) {
  const levelTextColors = {
    'BEGINNING': '#2d5a2d',     // Dark green
    'DEVELOPING': '#856404',    // Dark yellow/orange
    'PROFICIENT': '#004085',    // Dark blue
    'ADVANCED': '#721c24'       // Dark red
  };
  return levelTextColors[level] || '#000000';
};

// Level filtering functionality
window.applyLevelFilter = function() {
  const checkboxes = document.querySelectorAll('#level-filter-container input[type="checkbox"]');
  window.selectedLevels = Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);
  
  console.log('Selected levels:', window.selectedLevels);
  
  // Recreate the table with filtered data
  if (window.skillData && window.contactData && window.scoreData) {
    const skills = JSON.parse(window.skillData);
    const contacts = JSON.parse(window.contactData);
    const scores = JSON.parse(window.scoreData);
    createTable(skills, contacts, scores);
  }
};

// Function to create the table
function createTable(skills, contacts, scores) {
  const headerContainer = document.getElementById('contact-headers');
  const tableContainer = document.getElementById('skills-table');
  
  // Clear existing content
  headerContainer.innerHTML = '';
  tableContainer.innerHTML = '';
  
  // Create contact headers
  contacts.forEach(contact => {
    const headerDiv = document.createElement('div');
    headerDiv.className = 'contact-header';
    headerDiv.textContent = contact.fieldData.contact;
    headerContainer.appendChild(headerDiv);
  });
  
  // Process and group skills by area
  const groupedSkills = groupSkillsByArea(skills, contacts, scores);
  
  // Create table content
  Object.keys(groupedSkills).forEach(area => {
    createGroupSection(area, groupedSkills[area], contacts, tableContainer);
  });
}

// Function to group skills by area and prepare data
function groupSkillsByArea(skills, contacts, scores) {
  const levelOrder = ['BEGINNING', 'DEVELOPING', 'PROFICIENT', 'ADVANCED'];
  
  // Filter skills by selected levels
  const filteredSkills = skills.filter(skill => 
    window.selectedLevels.includes(skill.fieldData.level)
  );
  
  // Group by area
  const grouped = {};
  
  filteredSkills.forEach(skill => {
    const area = skill.fieldData.Area;
    if (!grouped[area]) {
      grouped[area] = [];
    }
    
    // Prepare skill data with scores
    const skillData = {
      id: skill.fieldData.__ID,
      skill: skill.fieldData.Skill,
      level: skill.fieldData.level,
      area: skill.fieldData.Area,
      scores: {}
    };
    
    // Add scores for each contact
    contacts.forEach(contact => {
      const contactId = contact.fieldData.contact_id;
      const scoreEntry = scores.find(score => 
        score.fieldData.Skill_ID === skill.fieldData.__ID && 
        score.fieldData.Contact_ID === contactId
      );
      
      if (scoreEntry) {
        const rawScore = scoreEntry.fieldData.Data; // Note: Data field, not Score
        const scoreValue = (rawScore === null || rawScore === undefined) ? "-" : rawScore;
        const passValue = scoreEntry.fieldData.pass;
        const isPass = passValue === true || passValue === "true" || passValue === 1 || passValue === "1";
        
        skillData.scores[contactId] = {
          value: scoreValue,
          pass: isPass,
          metadata: {
            author: scoreEntry.fieldData.user || scoreEntry.fieldData.zzCreatedAcct || '',
            lastUpdated: scoreEntry.fieldData.date || '',
            editableDate: formatDate(scoreEntry.fieldData.date || scoreEntry.fieldData.zzCreatedTimestamp || ''),
            zzCreatedName: scoreEntry.fieldData.zzCreatedName || '',
            zzCreatedTimestamp: scoreEntry.fieldData.zzCreatedTimestamp || ''
          }
        };
      } else {
        skillData.scores[contactId] = {
          value: "-",
          pass: false,
          metadata: null
        };
      }
    });
    
    grouped[area].push(skillData);
  });
  
  // Sort skills within each group by level, then by skill name
  Object.keys(grouped).forEach(area => {
    grouped[area].sort((a, b) => {
      const aLevelIndex = levelOrder.indexOf(a.level);
      const bLevelIndex = levelOrder.indexOf(b.level);
      if (aLevelIndex !== bLevelIndex) {
        return aLevelIndex - bLevelIndex;
      }
      return a.skill.localeCompare(b.skill);
    });
  });
  
  return grouped;
}

// Function to create a group section
function createGroupSection(area, skills, contacts, container) {
  const groupDiv = document.createElement('div');
  groupDiv.className = 'group-section';
  
  // Create group header
  const headerDiv = document.createElement('div');
  headerDiv.className = 'group-header';
  headerDiv.onclick = () => toggleGroup(headerDiv);
  
  const toggleSpan = document.createElement('span');
  toggleSpan.className = 'group-toggle';
  
  const titleSpan = document.createElement('span');
  titleSpan.textContent = `${area} (${skills.length} skills)`;
  
  headerDiv.appendChild(toggleSpan);
  headerDiv.appendChild(titleSpan);
  
  // Create group content
  const contentDiv = document.createElement('div');
  contentDiv.className = 'group-content';
  
  // Add skills to the group
  skills.forEach(skill => {
    const rowDiv = createSkillRow(skill, contacts);
    contentDiv.appendChild(rowDiv);
  });
  
  // Create group footer with contact-specific notes buttons
  const footerDiv = document.createElement('div');
  footerDiv.className = 'group-footer';
  
  // Create the skill column area
  const footerSkillArea = document.createElement('div');
  footerSkillArea.className = 'footer-skill-area';
  footerSkillArea.style.width = '400px';
  footerSkillArea.style.minWidth = '400px';
  footerSkillArea.style.maxWidth = '400px';
  footerSkillArea.style.padding = '8px 12px';
  footerSkillArea.style.borderRight = '1px solid #ddd';
  footerSkillArea.style.background = '#f1f3f4';
  footerSkillArea.style.position = 'sticky';
  footerSkillArea.style.left = '0';
  footerSkillArea.style.zIndex = '90';
  footerSkillArea.style.display = 'flex';
  footerSkillArea.style.alignItems = 'center';
  footerSkillArea.style.boxSizing = 'border-box';
  footerSkillArea.style.flexShrink = '0';
  footerSkillArea.textContent = `${area} Summary`;
  
  // Create the contact buttons area
  const footerContactsArea = document.createElement('div');
  footerContactsArea.className = 'footer-contacts-area';
  footerContactsArea.style.display = 'flex';
  footerContactsArea.style.flex = '1';
  footerContactsArea.style.minWidth = '0';
  
  // Create notes buttons for each contact
  contacts.forEach(contact => {
    const contactName = contact.fieldData.contact;
    const contactId = contact.fieldData.contact_id;
    
    const contactFooterDiv = document.createElement('div');
    contactFooterDiv.style.width = '150px';
    contactFooterDiv.style.minWidth = '150px';
    contactFooterDiv.style.maxWidth = '150px';
    contactFooterDiv.style.padding = '4px';
    contactFooterDiv.style.borderRight = '1px solid #ddd';
    contactFooterDiv.style.background = '#f1f3f4';
    contactFooterDiv.style.display = 'flex';
    contactFooterDiv.style.flexDirection = 'column';
    contactFooterDiv.style.alignItems = 'center';
    contactFooterDiv.style.gap = '3px';
    contactFooterDiv.style.boxSizing = 'border-box';
    contactFooterDiv.style.flexShrink = '0';
    
    // Add note button
    const addNoteBtn = document.createElement('button');
    addNoteBtn.textContent = 'Add Note';
    addNoteBtn.title = `Add note for ${contactName}`;
    addNoteBtn.style.fontSize = '10px';
    addNoteBtn.style.padding = '4px 6px';
    addNoteBtn.style.margin = '0';
    addNoteBtn.style.whiteSpace = 'nowrap';
    addNoteBtn.style.width = 'calc(100% - 4px)';
    addNoteBtn.style.cursor = 'pointer';
    addNoteBtn.style.border = '1px solid #007acc';
    addNoteBtn.style.background = '#007acc';
    addNoteBtn.style.color = 'white';
    addNoteBtn.style.borderRadius = '4px';
    addNoteBtn.style.fontWeight = '500';
    addNoteBtn.style.transition = 'all 0.2s ease';
    addNoteBtn.onclick = () => openNotesModal(area, 'add', contactName, contactId);
    
    // View notes button
    const viewNotesBtn = document.createElement('button');
    viewNotesBtn.textContent = 'View Notes';
    viewNotesBtn.title = `View notes for ${contactName}`;
    viewNotesBtn.style.fontSize = '10px';
    viewNotesBtn.style.padding = '4px 6px';
    viewNotesBtn.style.margin = '0';
    viewNotesBtn.style.whiteSpace = 'nowrap';
    viewNotesBtn.style.width = 'calc(100% - 4px)';
    viewNotesBtn.style.cursor = 'pointer';
    viewNotesBtn.style.border = '1px solid #666';
    viewNotesBtn.style.background = '#f8f9fa';
    viewNotesBtn.style.color = '#333';
    viewNotesBtn.style.borderRadius = '4px';
    viewNotesBtn.style.fontWeight = '500';
    viewNotesBtn.style.transition = 'all 0.2s ease';
    viewNotesBtn.onclick = () => openNotesModal(area, 'view', contactName, contactId);
    
    contactFooterDiv.appendChild(addNoteBtn);
    contactFooterDiv.appendChild(viewNotesBtn);
    footerContactsArea.appendChild(contactFooterDiv);
  });
  
  // Assemble the footer
  footerDiv.appendChild(footerSkillArea);
  footerDiv.appendChild(footerContactsArea);
  
  // Assemble the group
  groupDiv.appendChild(headerDiv);
  groupDiv.appendChild(contentDiv);
  groupDiv.appendChild(footerDiv);
  
  container.appendChild(groupDiv);
}

// Function to create a skill row
function createSkillRow(skill, contacts) {
  const rowDiv = document.createElement('div');
  rowDiv.className = 'skill-row';
  
  // Create skill cell
  const skillCell = document.createElement('div');
  skillCell.className = 'skill-cell';
  skillCell.style.backgroundColor = getLevelColor(skill.level);
  skillCell.style.color = getLevelTextColor(skill.level);
  skillCell.textContent = skill.skill;
  
  // Create score cells container
  const scoreCellsDiv = document.createElement('div');
  scoreCellsDiv.className = 'score-cells';
  
  // Add score cells for each contact
  contacts.forEach(contact => {
    const contactId = contact.fieldData.contact_id;
    const contactName = contact.fieldData.contact;
    const scoreData = skill.scores[contactId];
    
    const scoreCell = document.createElement('div');
    scoreCell.className = 'score-cell';
    scoreCell.style.backgroundColor = getLevelColor(skill.level);
    scoreCell.style.color = getLevelTextColor(skill.level);
    
    // Add click handler for score editing
    scoreCell.onclick = () => openScoreModal(
      skill.skill, 
      contactName, 
      skill.id, 
      contactId, 
      scoreData.value, 
      scoreData.pass, 
      scoreData.metadata
    );
    
    // Create score value
    const scoreValue = document.createElement('div');
    scoreValue.className = 'score-value';
    scoreValue.textContent = scoreData.value;
    
    // Create metadata if available
    const metadataDiv = document.createElement('div');
    metadataDiv.className = 'score-metadata';
    if (scoreData.value !== "-" && scoreData.metadata) {
      const author = scoreData.metadata.author || '';
      const date = scoreData.metadata.editableDate || '';
      metadataDiv.innerHTML = `${author}<br><span>${date}</span>`;
    }
    
    // Add pass indicator if applicable
    if (scoreData.pass) {
      const passIndicator = document.createElement('div');
      passIndicator.className = 'pass-indicator';
      passIndicator.textContent = '✓';
      scoreCell.appendChild(passIndicator);
    }
    
    scoreCell.appendChild(scoreValue);
    scoreCell.appendChild(metadataDiv);
    scoreCellsDiv.appendChild(scoreCell);
  });
  
  rowDiv.appendChild(skillCell);
  rowDiv.appendChild(scoreCellsDiv);
  
  return rowDiv;
}

// Function to toggle group visibility
function toggleGroup(headerElement) {
  const groupSection = headerElement.parentElement;
  groupSection.classList.toggle('collapsed');
}

// Helper function to format date for display
function formatDate(dateString) {
  if (!dateString) return "";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${month}/${day}/${year}`;
  } catch (e) {
    return dateString;
  }
}

// Function to set the current user (can be called from FileMaker)
window.setCurrentUser = function(userName) {
  window.currentUser = userName;
  console.log('Current user set to:', userName);
};

// Score Modal functions
window.openScoreModal = function(skillName, contactName, skillId, contactId, currentScore, passValue, metadata) {
  console.log('openScoreModal called with:', { skillName, contactName, skillId, contactId, currentScore, passValue, metadata });
  
  window.currentSkillName = skillName;
  window.currentSkillId = skillId;
  window.currentScoreContactId = contactId;
  window.currentScoreContactName = contactName;
  
  // Set modal title
  document.getElementById('scoreModalTitle').textContent = `Edit Score - ${skillName} - ${contactName}`;
  
  // Set current values
  document.getElementById('scoreSelect').value = currentScore || '-';
  document.getElementById('passCheckbox').checked = passValue === true || passValue === "true" || passValue === 1 || passValue === "1";
  
  // Set metadata if available
  if (metadata) {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('scoreDate').value = metadata.editableDate ? new Date(metadata.editableDate).toISOString().split('T')[0] : today;
    document.getElementById('scoreUser').value = metadata.author || window.currentUser;
  } else {
    // Set defaults for new entries
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('scoreDate').value = today;
    document.getElementById('scoreUser').value = window.currentUser;
  }
  
  // Show modal
  document.getElementById('scoreModal').style.display = 'block';
};

window.closeScoreModal = function() {
  document.getElementById('scoreModal').style.display = 'none';
};

window.saveScore = function() {
  const score = document.getElementById('scoreSelect').value;
  const pass = document.getElementById('passCheckbox').checked;
  const date = document.getElementById('scoreDate').value;
  const user = document.getElementById('scoreUser').value;
  
  // Validate inputs
  if (!date) {
    alert('Please select a date.');
    document.getElementById('scoreDate').focus();
    return;
  }
  
  if (!user.trim()) {
    alert('Please enter a user name.');
    document.getElementById('scoreUser').focus();
    return;
  }
  
  // Convert date to display format
  let displayDate = date;
  if (date) {
    try {
      const dateObj = new Date(date);
      displayDate = dateObj.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit', 
        year: 'numeric'
      });
    } catch (e) {
      displayDate = date;
    }
  }
  
  console.log('Saving score:', { 
    skill: window.currentSkillId, 
    contact: window.currentScoreContactId, 
    score, 
    pass, 
    date: displayDate, 
    user 
  });
  
  // Create the same parameter structure as the original Tabulator version
  const updateResult = {
    "conId": window.currentScoreContactId,
    "skillId": window.currentSkillId,
    "value": score,
    "pass": pass,
    "mode": 'updateScore',
    "user": user,
    "date": displayDate,
    "timestamp": new Date().toISOString()
  };
  
  // Show saving indicator
  const saveBtn = document.querySelector('#scoreModal .save-btn');
  const originalText = saveBtn.textContent;
  saveBtn.textContent = 'Saving...';
  saveBtn.disabled = true;
  saveBtn.style.opacity = '0.7';
  
  // Use the exact same FileMaker script call structure as the original
  if (typeof runScript === 'function') {
    runScript(JSON.stringify(updateResult));
    console.log('Data sent to FileMaker successfully');
    
    // Update the local data immediately for UI responsiveness
    updateLocalScoreData(window.currentScoreContactId, window.currentSkillId, score, pass, displayDate);
    
    // Show success briefly before closing
    saveBtn.textContent = 'Saved ✓';
    saveBtn.style.background = '#28a745';
    setTimeout(() => {
      closeScoreModal();
      // Reset button state for next time
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
      saveBtn.style.opacity = '1';
      saveBtn.style.background = '';
    }, 500);
  } else if (typeof FileMaker !== 'undefined' && typeof FileMaker.PerformScriptWithOption === 'function') {
    FileMaker.PerformScriptWithOption("Manage: Competencies", JSON.stringify(updateResult), 0);
    console.log('Data sent to FileMaker successfully via PerformScriptWithOption');
    
    // Update the local data immediately for UI responsiveness
    updateLocalScoreData(window.currentScoreContactId, window.currentSkillId, score, pass, displayDate);
    
    // Show success briefly before closing
    saveBtn.textContent = 'Saved ✓';
    saveBtn.style.background = '#28a745';
    setTimeout(() => {
      closeScoreModal();
      // Reset button state for next time
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
      saveBtn.style.opacity = '1';
      saveBtn.style.background = '';
    }, 500);
  } else {
    console.error('FileMaker runScript function not available');
    
    // Update the local data for testing without FileMaker
    updateLocalScoreData(window.currentScoreContactId, window.currentSkillId, score, pass, displayDate);
    
    alert('Score saved locally (FileMaker integration not available)');
    
    // Reset button state
    saveBtn.textContent = originalText;
    saveBtn.disabled = false;
    saveBtn.style.opacity = '1';
    
    closeScoreModal();
  }
};

// Notes Modal functions
window.openNotesModal = function(groupOrSkillName, mode, contactName = '', contactId = '') {
  console.log('openNotesModal called with:', { groupOrSkillName, mode, contactName, contactId });
  
  window.currentGroupName = groupOrSkillName;
  window.currentContactName = contactName;
  window.currentContactId = contactId; // Store contactId for compatibility
  window.currentMode = mode;
  
  if (mode === 'group') {
    document.getElementById('modalTitle').textContent = `${groupOrSkillName} Notes`;
  } else {
    document.getElementById('modalTitle').textContent = `${groupOrSkillName} - ${contactName} Notes`;
  }
  
  // Load existing notes using the same structure as the original
  window.loadExistingNotes(groupOrSkillName, contactId);
  
  // Show modal
  document.getElementById('notesModal').style.display = 'block';
};

window.loadExistingNotes = function(groupName, contactId) {
  // Use the same parameter structure as the original Tabulator version
  const result = {
    "groupName": groupName,
    "contactId": contactId,
    "mode": 'loadNotes'
  };
  
  console.log('Loading existing notes:', result);
  
  // Check if FileMaker runScript is available (same as original)
  if (typeof runScript === 'function') {
    runScript(JSON.stringify(result));
  } else if (typeof FileMaker !== 'undefined' && typeof FileMaker.PerformScriptWithOption === 'function') {
    FileMaker.PerformScriptWithOption("Manage: Competencies", JSON.stringify(result), 0);
  } else {
    console.log('FileMaker integration not available, showing sample notes');
    // For testing without FileMaker - use the actual data structure
    window.displayNotes(JSON.stringify([
      { 
        author: "Admin", 
        noteId: "1", 
        noteText: "Sample note 1 - This is a test note", 
        timestamp: "2025-08-20 16:58:34" 
      },
      { 
        author: "Test User", 
        noteId: "2", 
        noteText: "Sample note 2 - Another test note with more content", 
        timestamp: "2025-08-19 14:30:15" 
      }
    ]));
  }
};

window.closeNotesModal = function() {
  document.getElementById('notesModal').style.display = 'none';
  document.getElementById('noteTextarea').style.display = 'none';
  document.getElementById('noteDisplay').style.display = 'none';
  document.getElementById('saveNoteBtn').style.display = 'none';
};

// Function to receive notes data from FileMaker
window.displayNotes = function(notesData) {
  console.log('displayNotes called with:', notesData);
  
  const notes = JSON.parse(notesData);
  const noteDisplay = document.getElementById('noteDisplay');
  const noteTextarea = document.getElementById('noteTextarea');
  const saveBtn = document.getElementById('saveNoteBtn');
  
  // Show existing notes
  noteDisplay.style.display = 'block';
  noteTextarea.style.display = 'block';
  saveBtn.style.display = 'inline-block';
  
  // Display existing notes with the correct data structure
  if (notes && notes.length > 0) {
    let notesHtml = '<h4>Existing Notes:</h4>';
    notes.forEach(note => {
      // Format the timestamp for display
      let displayDate = note.timestamp || '';
      if (displayDate) {
        try {
          // Handle the timestamp format "2025-08-20 04:58:34"
          const date = new Date(displayDate.replace(' ', 'T')); // Convert to ISO format
          if (!isNaN(date.getTime())) {
            displayDate = date.toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric'
            }) + ' ' + date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            });
          }
        } catch (e) {
          // Keep original if parsing fails
          console.log('Date parsing error:', e);
        }
      }
      
      notesHtml += `<div style="margin-bottom: 10px; padding: 8px; background: white; border-radius: 4px; border-left: 3px solid #007bff;">
                      <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
                        ${note.author || 'Unknown'} - ${displayDate}
                      </div>
                      <div>${note.noteText || note.note || ''}</div>
                    </div>`;
    });
    noteDisplay.innerHTML = notesHtml;
  } else {
    noteDisplay.innerHTML = '<p style="color: #666; font-style: italic;">No existing notes.</p>';
  }
};

window.saveNote = function() {
  const noteText = document.getElementById('noteTextarea').value.trim();
  
  if (!noteText) {
    alert('Please enter a note before saving.');
    return;
  }
  
  // Use the exact same parameter structure as the original Tabulator version
  const result = {
    "groupName": window.currentGroupName,
    "contactId": window.currentContactId,
    "contactName": window.currentContactName,
    "noteText": noteText,
    "timestamp": new Date().toISOString(),
    "author": window.currentUser || "Unknown User",
    "mode": 'saveNote'
  };
  
  console.log('Saving note:', result);
  
  // Use the exact same FileMaker script call structure as the original
  if (typeof runScript === 'function') {
    runScript(JSON.stringify(result));
  } else if (typeof FileMaker !== 'undefined' && typeof FileMaker.PerformScriptWithOption === 'function') {
    FileMaker.PerformScriptWithOption("Manage: Competencies", JSON.stringify(result), 0);
  } else {
    console.error('FileMaker runScript function not available');
    alert('Note saved locally (FileMaker integration not available)');
  }
  
  // Clear the textarea
  document.getElementById('noteTextarea').value = '';
  
  closeNotesModal();
};

// Function to update local score data and refresh display
function updateLocalScoreData(contactId, skillId, scoreValue, passValue, displayDate) {
  if (window.skillData && window.contactData && window.scoreData) {
    // Update the score data
    const scores = JSON.parse(window.scoreData);
    let scoreEntry = scores.find(score => 
      score.fieldData.Skill_ID === skillId && 
      score.fieldData.Contact_ID === contactId
    );
    
    // Use window.currentUser instead of any user input for consistency
    const actualUser = window.currentUser || "Current User";
    
    if (scoreEntry) {
      // Update existing entry
      scoreEntry.fieldData.Data = scoreValue;
      scoreEntry.fieldData.pass = passValue ? 1 : 0;
      scoreEntry.fieldData.user = actualUser; // Use window.currentUser
      scoreEntry.fieldData.date = displayDate;
      scoreEntry.fieldData.zzCreatedTimestamp = new Date().toLocaleString('en-US');
      scoreEntry.fieldData.zzCreatedAcct = actualUser; // Also update created account
    } else {
      // Create new entry
      scoreEntry = {
        fieldData: {
          Skill_ID: skillId,
          Contact_ID: contactId,
          Data: scoreValue,
          pass: passValue ? 1 : 0,
          user: actualUser, // Use window.currentUser
          date: displayDate,
          zzCreatedAcct: actualUser, // Use window.currentUser
          zzCreatedName: actualUser, // Use window.currentUser
          zzCreatedTimestamp: new Date().toLocaleString('en-US')
        }
      };
      scores.push(scoreEntry);
    }
    
    // Update the global data
    window.scoreData = JSON.stringify(scores);
    
    // Refresh the table display
    window.refreshTable();
    
    console.log('Local score data updated with window.currentUser:', actualUser);
  }
}

// Function to refresh table data (called from FileMaker after updates)
window.refreshTable = function() {
  if (window.skillData && window.contactData && window.scoreData) {
    const skills = JSON.parse(window.skillData);
    const contacts = JSON.parse(window.contactData);
    const scores = JSON.parse(window.scoreData);
    createTable(skills, contacts, scores);
  }
};

// FileMaker integration function (same as original)
runScript = function (param) {
  FileMaker.PerformScriptWithOption("Manage: Competencies", param, 0);
};

// Function to update pass checkbox from FileMaker (if needed)
window.updatePassCheckbox = function(contactId, skillId, passValue) {
  console.log('updatePassCheckbox called:', { contactId, skillId, passValue });
  // Update the table data and refresh the display
  if (window.skillData && window.contactData && window.scoreData) {
    // Update the score data
    const scores = JSON.parse(window.scoreData);
    const scoreEntry = scores.find(score => 
      score.fieldData.Skill_ID === skillId && 
      score.fieldData.Contact_ID === contactId
    );
    
    if (scoreEntry) {
      scoreEntry.fieldData.pass = passValue; // Note: lowercase 'pass'
      window.scoreData = JSON.stringify(scores);
      
      // Refresh the table
      window.refreshTable();
    }
  }
};

// Function to update score from FileMaker (if needed)
window.updateScore = function(contactId, skillId, scoreValue) {
  console.log('updateScore called:', { contactId, skillId, scoreValue });
  // Update the table data and refresh the display
  if (window.skillData && window.contactData && window.scoreData) {
    // Update the score data
    const scores = JSON.parse(window.scoreData);
    const scoreEntry = scores.find(score => 
      score.fieldData.Skill_ID === skillId && 
      score.fieldData.Contact_ID === contactId
    );
    
    if (scoreEntry) {
      scoreEntry.fieldData.Data = scoreValue; // Note: 'Data' field, not 'Score'
      window.scoreData = JSON.stringify(scores);
      
      // Refresh the table
      window.refreshTable();
    }
  }
};

// Modal event handlers
document.addEventListener('DOMContentLoaded', function() {
  // Close modals when clicking outside
  window.addEventListener('click', function(event) {
    const scoreModal = document.getElementById('scoreModal');
    const notesModal = document.getElementById('notesModal');
    
    if (event.target === scoreModal) {
      closeScoreModal();
    }
    if (event.target === notesModal) {
      closeNotesModal();
    }
  });
  
  // Close modals when clicking X
  document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.onclick = function() {
      closeScoreModal();
      closeNotesModal();
    };
  });
});

// Test function (for development)
window.testTable = function() {
  const sampleSkillData = JSON.stringify([
    {
      fieldData: {
        Area: "KNIFE SKILLS",
        Skill: "I can clean and store knives properly",
        __ID: "skill1",
        level: "BEGINNING"
      }
    },
    {
      fieldData: {
        Area: "KNIFE SKILLS", 
        Skill: "I can make simple cuts with guidance",
        __ID: "skill2",
        level: "BEGINNING"
      }
    },
    {
      fieldData: {
        Area: "COOKING TECHNIQUES",
        Skill: "I can prepare basic sauces",
        __ID: "skill3", 
        level: "DEVELOPING"
      }
    }
  ]);
  
  const sampleContactData = JSON.stringify([
    {
      fieldData: {
        contact: "John Doe",
        contact_id: "contact1"
      }
    },
    {
      fieldData: {
        contact: "Jane Smith", 
        contact_id: "contact2"
      }
    }
  ]);
  
  const sampleScoreData = JSON.stringify([
    {
      fieldData: {
        Skill_ID: "skill1",
        Contact_ID: "contact1",
        Data: "2", // Note: Data field, not Score
        pass: 1, // Note: lowercase pass, numeric value
        user: "Test User",
        date: "08/20/2025",
        zzCreatedAcct: "Admin",
        zzCreatedName: "Bradley Cranston",
        zzCreatedTimestamp: "08/20/2025 16:41:59"
      }
    },
    {
      fieldData: {
        Skill_ID: "skill2",
        Contact_ID: "contact2", 
        Data: "3",
        pass: 1,
        user: "Test User",
        date: "08/19/2025",
        zzCreatedAcct: "Admin",
        zzCreatedName: "Bradley Cranston",
        zzCreatedTimestamp: "08/19/2025 10:30:00"
      }
    }
  ]);
  
  loadTable(sampleSkillData, sampleContactData, sampleScoreData, "Test User");
};
