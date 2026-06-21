const monthlyTarget = 120;

function daysSince(dateString) {

  const startDate = new Date(dateString);
  const today = new Date();
  startDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffInMs = today - startDate;
  const daysPassed = Math.floor(diffInMs / msPerDay);
  return daysPassed + 1;

}

function getStartAndEndDates() {
  const now = new Date();

  let startDate = new Date(now.getFullYear(), now.getMonth(), 28);
  if (now.getDate() < 28) {
    startDate.setMonth(startDate.getMonth() - 1);
  }

  let endDate = new Date(now.getFullYear(), now.getMonth(), 27);
  if (now.getDate() >= 27) {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

function daysBetween(startDateStr, endDateStr) {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  // Set both to midnight to avoid time differences
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffInMs = endDate - startDate;

  if (diffInMs < 0) return 0; // or throw error if invalid

  return Math.floor(diffInMs / msPerDay) + 1; // +1 to include both start and end
}

function getDisplayMonth() {
  const now = new Date();
  let monthIndex = now.getMonth();
  // If today is 28 or later, use next month
  if (now.getDate() >= 28) {
    monthIndex = (monthIndex + 1) % 12;
  }
  // Get month name
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return monthNames[monthIndex];
}

async function getInfo(username) {
  const { startDate, endDate } = getStartAndEndDates();

  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // login: "username",
      login: username,
      startDate,
      endDate,
    }),
  };
  try {
    // const response = await fetch('https://logtime-med.1337.ma/api/get_log', options);

    const fakeResponse = {
      "hydra:member": [
        {
          totalHours: 10,
        },
      ],
    };
    return fakeResponse["hydra:member"][0]["totalHours"];

    const data = await response.json();
    //this stupid app doesn't return 404 when wrong user is entred
    if (data["hydra:totalItems"] == 0) {
      throw new Error("bad username");
    }
    // const username = data["hydra:member"][0]["username"];
    const hours = data["hydra:member"][0]["totalHours"];
    return hours;
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

function drawCircles(doneHours, days, todayNumber) {
  const cirdiv = document.getElementById("circles");
  cirdiv.innerHTML = ""; // Clear previous circles
  const dailyTarget = monthlyTarget / days;
  const todaysGoal = todayNumber * dailyTarget;

  if (doneHours >= todaysGoal) {
    // On or ahead of pace
    // 1. Draw green-done for each finished day up to today
    for (let i = 0; i < todayNumber; i++) {
      let c = document.createElement("div");
      c.classList.add("circle-green-done");
      cirdiv.appendChild(c);
    }
    // 2. Draw green-over for extra days completed beyond today
    let extraDays = Math.floor((doneHours - todaysGoal) / dailyTarget);
    for (let i = 0; i < extraDays; i++) {
      let c = document.createElement("div");
      c.classList.add("circle-green-over");
      cirdiv.appendChild(c);
    }
    let remaining = days - todayNumber - extraDays;
    for (let i = 0; i < remaining; i++) {
      let c = document.createElement("div");
      c.classList.add("gray");
      cirdiv.appendChild(c);
    }
  } else {
    // Behind pace
    // 1. Draw red-done for completed days
    let completedDays = Math.floor(doneHours / dailyTarget);
    for (let i = 0; i < completedDays; i++) {
      let c = document.createElement("div");
      c.classList.add("circle-red-done");
      cirdiv.appendChild(c);
    }
    // 2. Draw red-pending for days needed to catch up
    let catchupDays = Math.ceil((todaysGoal - doneHours) / dailyTarget);
    for (let i = 0; i < catchupDays; i++) {
      let c = document.createElement("div");
      c.classList.add("circle-red-pending");
      cirdiv.appendChild(c);
    }
    // 3. Draw gray for the rest
    let remaining = days - completedDays - catchupDays;
    for (let i = 0; i < remaining; i++) {
      let c = document.createElement("div");
      c.classList.add("gray");
      cirdiv.appendChild(c);
    }
  }
}

async function core() {
  try {
    let username = localStorage.getItem("username");
    if (!username) {
      username = prompt("Please enter your login");
      localStorage.setItem("username", username);
    }
    const doneHours = await getInfo(username);
    // update goal hours
    document.getElementById("target-hours").textContent = monthlyTarget;
    // update nav username
    document.getElementById("login").textContent = username;
    // update logged hours
    const span = document.getElementById("current-hours");
    span.textContent = doneHours;

    // update month name
    document.getElementById("month").textContent = getDisplayMonth();

    // update pace title
    const pacettl = document.getElementById("pace-title");

    const { startDate, endDate } = getStartAndEndDates();
    const todaysGoal = daysSince(startDate) * (monthlyTarget / daysBetween(startDate, endDate));

    const countbg = document.getElementById("count-bg");
    const dailyGoalBar = document.getElementById("daily-goal")

    if (doneHours >= todaysGoal) {
      if (doneHours < monthlyTarget) {
        let extraDays = Math.floor(
          (doneHours - todaysGoal) /
            (monthlyTarget / daysBetween(startDate, endDate)),
        );
        pacettl.innerHTML = `You are <span id="pace-msg-above">ahead of pace</span>,
					at this rate you’ll finish <span class="font-semibold underline decoration-green-400 decoration-dashed decoration-2">${extraDays} ${extraDays > 1 ? "days" : "day"}
					earlier </span> . <br> make sure to relax your eyes.`;

        countbg.classList.add("bg-green-800");
        dailyGoalBar.classList.add("bg-lime-300");

      } else {
        pacettl.innerHTML = `You are <span id="pace-msg-above">ahead of pace</span>, make sure to relax your eyes.`;

        countbg.classList.remove("bg-green-800")
        countbg.classList.add("bg-green-800");

        countbg.classList.remove("bg-lime-300")
        dailyGoalBar.classList.add("bg-lime-300");
      }
    } else {
      pacettl.innerHTML = `You are <span id="pace-msg-below">behind pace</span> and won’t reach your goal at this rate. <br> Try to catch up, but remember to rest your eyes.`;
        countbg.classList.remove("bg-green-800")
        countbg.classList.add("bg-red-800");

        countbg.classList.remove("bg-lime-300")
        dailyGoalBar.classList.add("bg-red-300");
    }


    // circles
    drawCircles(
      doneHours,
      daysBetween(startDate, endDate),
      daysSince(startDate),
    );
  } catch (err) {
    console.error(err);
  }
}
// core app
window.onload = async function () {
  await core();
  document.getElementById("login").onclick = update;
};

function update() {
  let username = prompt("Please enter your login");
  if (username) {
    localStorage.setItem("username", username);
    core();
  }
}
