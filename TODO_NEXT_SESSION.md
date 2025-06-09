# Next Session Priority Tasks

## **Immediate Tasks**

### **1. Build Tags System**
- Create tags table in database
- Implement auto-tagging logic:
  - `answered-call` (Answer Call Snippet sent)
  - `voicemail-left` (Voicemail Part 1 sent)
  - `viewed-during-call` (site visit between call start → call end)
  - `viewed-after-voicemail` (site visit after voicemail sent)
  - `return-visitor` (multiple site visits)
- Add manual tagging:
  - `callback-received` button
- Display tags as colored badges in Overview tab
- Add tag filtering to pipeline

### **2. Comprehensive API Testing**
Create test script for:
- **Edge Cases:**
  - Website visit BEFORE calling them
  - Session ends but activities keep coming
  - Multiple concurrent sessions
  - Call end detection accuracy
- **Stress Tests:**
  - 50+ activities in one session
  - Rapid stage transitions
  - Website visits during different stages
- **Error Scenarios:**
  - Invalid session IDs
  - Missing company data
  - Network failures during tracking

### **3. Call End Detection Refinement**
Current triggers: owner email, name change, note added, unsuccessful button

**Consider adding:**
- Time-based detection (5+ minutes of inactivity)
- Manual "End Call" button
- Automatic detection when new call starts

### **4. Test Company Setup**
When user provides phone numbers:
- Create test companies with provided numbers
- Set up realistic test scenarios
- Document testing workflows

## **System Status**
- ✅ Pipeline stages working
- ✅ Auto-stage transitions working  
- ✅ Session management working
- ✅ Activity tracking working
- ✅ UI components complete
- ✅ Website analytics integration working
- 🔄 Tags system (in progress)
- ❌ Comprehensive testing needed
- ❌ Real number testing pending

## **User Feedback Needed**
- Tag system preferences (colors, display)
- Call end detection improvements
- Additional note types needed
- Test scenario priorities