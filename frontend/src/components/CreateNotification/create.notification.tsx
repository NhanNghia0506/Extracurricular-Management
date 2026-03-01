import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, faPaperPlane, faInfoCircle, faChevronDown,
  faBold, faItalic, faListUl, faLink, faCode 
} from '@fortawesome/free-solid-svg-icons';
import styles from './create.notification.module.scss';

const CreateNotification: React.FC = () => {
  return (
    <div className={styles.container}>
      {/* Header Page */}
      <header className={styles.pageHeader}>
        <div className={styles.headerFlex}>
          <div>
            <h1>Create Notification</h1>
            <p>Design and dispatch critical alerts to the university community.</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.btnGhost}>Save Draft</button>
            <button className={styles.btnPrimary}>Send Notification</button>
          </div>
        </div>
      </header>

      <div className={styles.layoutGrid}>
        {/* Left Column: Form */}
        <main className={styles.formContent}>
          
          {/* Step 1: Recipients */}
          <section className={styles.stepCard}>
            <div className={styles.stepHeader}>
              <span className={styles.stepNumber}>1</span>
              <h2>Recipients</h2>
            </div>
            <div className={styles.tabSwitcher}>
              <button>Personal</button>
              <button>Multiple Students</button>
              <button className={styles.active}>Broadcast</button>
            </div>
            <div className={styles.inputGrid}>
              <div className={styles.inputGroup}>
                <label>Target Role</label>
                <div className={styles.selectWrapper}>
                  <select><option>All Users</option></select>
                  <FontAwesomeIcon icon={faChevronDown} />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Department</label>
                <div className={styles.selectWrapper}>
                  <select><option>All Departments</option></select>
                  <FontAwesomeIcon icon={faChevronDown} />
                </div>
              </div>
            </div>
          </section>

          {/* Step 2: Main Content */}
          <section className={styles.stepCard}>
            <div className={styles.stepHeader}>
              <span className={styles.stepNumber}>2</span>
              <h2>Main Content</h2>
            </div>
            <div className={styles.inputGrid}>
              <div className={styles.inputGroup}>
                <label>Sender Name</label>
                <input type="text" placeholder="e.g. Registrar's Office" />
              </div>
              <div className={styles.inputGroup}>
                <label>Sender Type</label>
                <div className={styles.selectWrapper}>
                  <select><option>System Default</option></select>
                  <FontAwesomeIcon icon={faChevronDown} />
                </div>
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>Title</label>
              <input type="text" placeholder="Short descriptive title" />
            </div>
            <div className={styles.editorGroup}>
              <label>Message Content</label>
              <div className={styles.richEditor}>
                <div className={styles.editorToolbar}>
                  <FontAwesomeIcon icon={faBold} />
                  <FontAwesomeIcon icon={faItalic} />
                  <FontAwesomeIcon icon={faListUl} />
                  <FontAwesomeIcon icon={faLink} />
                  <FontAwesomeIcon icon={faCode} className={styles.codeIcon} />
                </div>
                <textarea placeholder="Enter the full message details here..." rows={6} />
              </div>
            </div>
          </section>

          {/* Step 3 & 4 Grid */}
          <div className={styles.twoColumnGrid}>
             <section className={styles.stepCard}>
                <div className={styles.stepHeader}>
                  <span className={styles.stepNumber}>3</span>
                  <h2>Categorization</h2>
                </div>
                <div className={styles.inputGroup}>
                  <label>NOTIFICATION TYPE</label>
                  <div className={styles.selectWrapper}><select><option>Official Alert</option></select></div>
                </div>
             </section>
             <section className={styles.stepCard}>
                <div className={styles.stepHeader}>
                  <span className={styles.stepNumber}>4</span>
                  <h2>Scheduling</h2>
                </div>
                <div className={styles.switchGroup}>
                   <span>Send Immediately</span>
                   <label className={styles.switch}>
                      <input type="checkbox" defaultChecked />
                      <span className={styles.slider}></span>
                   </label>
                </div>
             </section>
          </div>

          {/* Step 5: Advanced (JSON) */}
          <section className={styles.stepCard}>
             <div className={styles.stepHeader}>
                <span className={styles.stepNumber}>5</span>
                <h2>Advanced Configuration</h2>
                <FontAwesomeIcon icon={faChevronDown} className={styles.expandIcon} />
             </div>
             <div className={styles.jsonEditor}>
                <pre>{`{
  "allow_reply": false,
  "analytics_tag": "campaign_alpha",
  "push_sound": "default"
}`}</pre>
             </div>
          </section>
        </main>

        {/* Right Column: Preview & Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.previewTitle}>
            <FontAwesomeIcon icon={faEye} /> Inbox Preview
          </div>
          
          <div className={styles.mobileMockup}>
             <div className={styles.mockupHeader}>
                <span>NOTIFICATION</span>
             </div>
             <div className={styles.mockupContent}>
                <div className={styles.senderInfo}>
                   <div className={styles.miniLogo}>🏢</div>
                   <div>
                      <strong>Registrar's Office</strong>
                      <small>Just now</small>
                   </div>
                </div>
                <h5>Final Examination Timetable Released</h5>
                <p>The official schedule for the Fall 2024 semester...</p>
                <button className={styles.btnFull}>View Full Schedule</button>
             </div>
          </div>

          <div className={styles.estimationBox}>
             <FontAwesomeIcon icon={faInfoCircle} />
             <p>This broadcast will reach approximately <strong>4,250 recipients</strong> based on your filters.</p>
          </div>

          <button className={styles.btnSendLarge}>
             <FontAwesomeIcon icon={faPaperPlane} /> SEND NOTIFICATION NOW
          </button>
        </aside>
      </div>
    </div>
  );
};

export default CreateNotification;