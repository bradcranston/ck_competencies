# FileMaker Integration Compatibility

## ✅ Exact Script Names & Parameter Structures Maintained

### 1. **Score Updates**
**Script Name:** `"Manage: Competencies"`
**Function:** `runScript()` or `FileMaker.PerformScriptWithOption()`
**Parameters:**
```json
{
  "conId": "contact_id",
  "skillId": "skill_id", 
  "value": "score_value",
  "pass": true/false,
  "mode": "updateScore",
  "user": "username",
  "date": "MM/DD/YYYY",
  "timestamp": "ISO_timestamp"
}
```

### 2. **Notes - Save**
**Script Name:** `"Manage: Competencies"`
**Function:** `runScript()` or `FileMaker.PerformScriptWithOption()`
**Parameters:**
```json
{
  "groupName": "group_name",
  "contactId": "contact_id", 
  "contactName": "contact_name",
  "noteText": "note_content",
  "timestamp": "ISO_timestamp",
  "author": "username",
  "mode": "saveNote"
}
```

### 3. **Notes - Load**
**Script Name:** `"Manage: Competencies"`
**Function:** `runScript()` or `FileMaker.PerformScriptWithOption()`
**Parameters:**
```json
{
  "groupName": "group_name",
  "contactId": "contact_id",
  "mode": "loadNotes"
}
```

## 🔧 JavaScript Functions Available to FileMaker

### Primary Data Loading
- `window.loadTable(skillData, contactData, scoreData, user)` - Main function to load table
- `window.setCurrentUser(userName)` - Set current user
- `window.applyLevelFilter()` - Apply level filtering

### Data Updates (FileMaker can call these)
- `window.updateScore(contactId, skillId, scoreValue)` - Update score from FileMaker
- `window.updatePassCheckbox(contactId, skillId, passValue)` - Update pass status
- `window.refreshTable()` - Refresh entire table display
- `window.displayNotes(notesData)` - Display notes in modal

### Modal Operations
- `window.openScoreModal(skillName, contactName, skillId, contactId, currentScore, passValue, metadata)`
- `window.closeScoreModal()`
- `window.openNotesModal(groupName, mode, contactName, contactId)`
- `window.closeNotesModal()`

## 📋 Data Structure Compatibility

### Skills Data (JSON string)
```json
[{
  "fieldData": {
    "Area": "KNIFE SKILLS",
    "Skill": "I can clean knives properly", 
    "__ID": "skill_id",
    "level": "BEGINNING"
  }
}]
```

### Contacts Data (JSON string)
```json
[{
  "fieldData": {
    "contact": "John Doe",
    "contact_id": "contact_id"
  }
}]
```

### Scores Data (JSON string)
```json
[{
  "fieldData": {
    "Skill_ID": "skill_id",
    "Contact_ID": "contact_id", 
    "Data": "2", 
    "pass": 1,
    "user": "Admin",
    "date": "08/20/2025",
    "zzCreatedAcct": "Admin",
    "zzCreatedName": "Bradley Cranston",
    "zzCreatedTimestamp": "08/20/2025 16:41:59"
  }
}]
```

## ✅ What's Maintained from Original

1. **Exact same parameter structures** for all FileMaker scripts
2. **Same script names** (`"Manage: Competencies"`)
3. **Same function names** that FileMaker can call
4. **Same data structures** for all JSON inputs
5. **Same modal behavior** and user interface flow
6. **Same runScript() function** for backward compatibility

## 🆕 What's New (No Breaking Changes)

- **No Tabulator dependency** - Pure JavaScript implementation
- **Better performance** - Lighter weight
- **Easier customization** - Direct control over HTML/CSS
- **Same visual appearance** - Matches original design
- **Same functionality** - All features preserved

The new implementation is a **drop-in replacement** for the Tabulator version with zero changes required to your FileMaker scripts or integration code.
