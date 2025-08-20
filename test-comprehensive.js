// Test script to validate the new table implementation

// Create test data
const testSkillData = [
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
  },
  {
    fieldData: {
      Area: "COOKING TECHNIQUES",
      Skill: "I can cook pasta properly",
      __ID: "skill4", 
      level: "PROFICIENT"
    }
  },
  {
    fieldData: {
      Area: "FOOD SAFETY",
      Skill: "I understand temperature control",
      __ID: "skill5", 
      level: "ADVANCED"
    }
  }
];

const testContactData = [
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
  },
  {
    fieldData: {
      contact: "Bob Wilson",
      contact_id: "contact3"
    }
  }
];

const testScoreData = [
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
      user: "Jane Instructor",
      date: "08/19/2025",
      zzCreatedAcct: "Admin", 
      zzCreatedName: "Bradley Cranston",
      zzCreatedTimestamp: "08/19/2025 16:05:07"
    }
  },
  {
    fieldData: {
      Skill_ID: "skill3",
      Contact_ID: "contact1",
      Data: "1",
      pass: 0,
      user: "Test User",
      date: "08/18/2025",
      zzCreatedAcct: "Admin",
      zzCreatedName: "Bradley Cranston", 
      zzCreatedTimestamp: "08/18/2025 16:03:55"
    }
  },
  {
    fieldData: {
      Skill_ID: "skill4",
      Contact_ID: "contact3",
      Data: "N",
      pass: 0,
      user: "Bob Trainer",
      date: "08/17/2025",
      zzCreatedAcct: "Admin",
      zzCreatedName: "Bradley Cranston",
      zzCreatedTimestamp: "08/17/2025 16:03:31"
    }
  }
];

// Function to test the table
function runComprehensiveTest() {
  console.log('Running comprehensive test...');
  
  // Test 1: Load table with full data
  console.log('Test 1: Loading table with comprehensive data...');
  window.loadTable(
    JSON.stringify(testSkillData),
    JSON.stringify(testContactData), 
    JSON.stringify(testScoreData),
    "Test User"
  );
  
  setTimeout(() => {
    // Test 2: Check if groups are created
    const groups = document.querySelectorAll('.group-section');
    console.log(`Test 2: Found ${groups.length} groups (expected: 3)`);
    
    // Test 3: Check if skills are displayed
    const skillRows = document.querySelectorAll('.skill-row');
    console.log(`Test 3: Found ${skillRows.length} skill rows (expected: 5)`);
    
    // Test 4: Check if scores are displayed correctly
    const scoreCells = document.querySelectorAll('.score-cell');
    console.log(`Test 4: Found ${scoreCells.length} score cells (expected: 15)`);
    
    // Test 5: Check if pass indicators are shown
    const passIndicators = document.querySelectorAll('.pass-indicator');
    console.log(`Test 5: Found ${passIndicators.length} pass indicators (expected: 2)`);
    
    // Test 6: Test level filtering
    console.log('Test 6: Testing level filtering...');
    document.getElementById('level-beginning').checked = false;
    window.applyLevelFilter();
    
    setTimeout(() => {
      const filteredRows = document.querySelectorAll('.skill-row');
      console.log(`Test 6: After filtering out BEGINNING, found ${filteredRows.length} rows (expected: 3)`);
      
      // Restore all levels
      document.getElementById('level-beginning').checked = true;
      window.applyLevelFilter();
      
      console.log('✅ All tests completed! Check the visual interface for proper display.');
    }, 500);
  }, 1000);
}

// Auto-run test when page loads
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(runComprehensiveTest, 500);
});
