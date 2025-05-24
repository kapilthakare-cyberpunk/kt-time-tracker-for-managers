document.addEventListener('DOMContentLoaded', function() {
    // Initialize the storage if it doesn't exist
    if (!localStorage.getItem('timeTrackerLogs')) {
        localStorage.setItem('timeTrackerLogs', JSON.stringify([]));
    }
    if (!localStorage.getItem('employeeStatus')) {
        localStorage.setItem('employeeStatus', JSON.stringify({}));
    }

    // Get DOM elements
    const employeeSelect = document.getElementById('employeeSelect');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const lunchStartBtn = document.getElementById('lunchStartBtn');
    const lunchEndBtn = document.getElementById('lunchEndBtn');
    const shortBreakStartBtn = document.getElementById('shortBreakStartBtn');
    const shortBreakEndBtn = document.getElementById('shortBreakEndBtn');
    const activityLog = document.getElementById('activityLog');
    const statusTable = document.getElementById('statusTable');

    // Helper function to format date
    function formatDate(date) {
        return date.toISOString().replace('T', ' ').substr(0, 19);
    }

    // Function to log activity
    function logActivity(employee, activity) {
        if (!employee) {
            alert('Please select an employee');
            return;
        }

        const timestamp = new Date();
        const log = {
            employee,
            activity,
            timestamp: formatDate(timestamp)
        };

        const logs = JSON.parse(localStorage.getItem('timeTrackerLogs'));
        logs.push(log);
        localStorage.setItem('timeTrackerLogs', JSON.stringify(logs));

        // Update employee status
        const employeeStatus = JSON.parse(localStorage.getItem('employeeStatus'));
        employeeStatus[employee] = {
            status: activity,
            lastActivity: formatDate(timestamp)
        };
        localStorage.setItem('employeeStatus', JSON.stringify(employeeStatus));

        updateUI();
    }

    // Function to update UI
    function updateUI() {
        // Update activity log
        const logs = JSON.parse(localStorage.getItem('timeTrackerLogs'));
        const todayLogs = logs.filter(log => {
            const logDate = log.timestamp.split(' ')[0];
            const today = new Date().toISOString().split('T')[0];
            return logDate === today;
        });

        activityLog.innerHTML = todayLogs.reverse().map(log => 
            `<div class="mb-2">
                <strong>${log.timestamp}</strong> - ${log.employee}: ${log.activity}
            </div>`
        ).join('');

        // Update status table
        const employeeStatus = JSON.parse(localStorage.getItem('employeeStatus'));
        const employees = [
            "Samiir Shaikh", "Prakash Prasad", "Sujata Virkar",
            "Shiwani Gade", "Rupali Yawatkar", "Dipti Pawar"
        ];

        statusTable.innerHTML = employees.map(employee => {
            const status = employeeStatus[employee] || { status: 'Not Logged In', lastActivity: 'Never' };
            const statusClass = status.status === 'Logged In' ? 'status-active' : '';
            return `
                <tr class="${statusClass}">
                    <td>${employee}</td>
                    <td>${status.status}</td>
                    <td>${status.lastActivity}</td>
                </tr>
            `;
        }).join('');
    }

    // Event listeners
    loginBtn.addEventListener('click', () => logActivity(employeeSelect.value, 'Logged In'));
    logoutBtn.addEventListener('click', () => logActivity(employeeSelect.value, 'Logged Out'));
    lunchStartBtn.addEventListener('click', () => logActivity(employeeSelect.value, 'Started Lunch Break'));
    lunchEndBtn.addEventListener('click', () => logActivity(employeeSelect.value, 'Ended Lunch Break'));
    shortBreakStartBtn.addEventListener('click', () => logActivity(employeeSelect.value, 'Started Short Break'));
    shortBreakEndBtn.addEventListener('click', () => logActivity(employeeSelect.value, 'Ended Short Break'));

    // Initial UI update
    updateUI();
});