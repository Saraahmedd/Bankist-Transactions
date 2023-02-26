'use strict';

/////////////////////////////////////////////////
/////////////////////////////////////////////////
// BANKIST APP

/////////////////////////////////////////////////
// Data

// DIFFERENT DATA! Contains movement dates, currency and locale

const account1 = {
  owner: 'Jonas Schmedtmann',
  movements: [200, 455.23, -306.5, 25000, -642.21, -133.9, 79.97, 1300],
  interestRate: 1.2, // %
  pin: 1111,

  movementsDates: [
    '2020-11-18T21:31:17.178Z',
    '2020-12-23T07:42:02.383Z',
    '2021-01-28T09:15:04.904Z',
    '2021-04-01T10:17:24.185Z',
    '2022-05-08T14:11:59.604Z',
    '2022-05-27T17:01:17.194Z',
    '2022-07-11T23:36:17.929Z',
    '2022-09-06T10:51:36.790Z',
  ],
  currency: 'EUR',
  locale: 'pt-PT', // de-DE
};

const account2 = {
  owner: 'Jessica Davis',
  movements: [5000, 3400, -150, -790, -3210, -1000, 8500, -30],
  interestRate: 1.5,
  pin: 2222,

  movementsDates: [
    '2020-11-01T13:15:33.035Z',
    '2020-11-30T09:48:16.867Z',
    '2021-12-25T06:04:23.907Z',
    '2021-01-25T14:18:46.235Z',
    '2022-02-05T16:33:06.386Z',
    '2022-04-10T14:43:26.374Z',
    '2022-06-25T18:49:59.371Z',
    '2022-09-06T10:51:36.790Z',
  ],
  currency: 'USD',
  locale: 'en-US',
};

const accounts = [account1, account2];

/////////////////////////////////////////////////
// Elements
const labelWelcome = document.querySelector('.welcome');
const labelDate = document.querySelector('.balance_date');
const labelBalance = document.querySelector('.balance_value');
const labelSumIn = document.querySelector('.summary__value--in');
const labelSumOut = document.querySelector('.summary__value--out');
const labelSumInterest = document.querySelector('.summary__value--interest');
const labelTimer = document.querySelector('.timer');

const containerApp = document.querySelector('.app');
const containerMovements = document.querySelector('.movements');

const btnLogin = document.querySelector('.login__btn');
const btnTransfer = document.querySelector('.form__btn--transfer');
const btnLoan = document.querySelector('.form__btn--loan');
const btnClose = document.querySelector('.form__btn--close');
const btnSort = document.querySelector('.btn--sort');

const inputLoginUsername = document.querySelector('.login__input--user');
const inputLoginPin = document.querySelector('.login__input--pin');
const inputTransferTo = document.querySelector('.form__input--to');
const inputTransferAmount = document.querySelector('.form__input--amount');
const inputLoanAmount = document.querySelector('.form__input--loan-amount');
const inputCloseUsername = document.querySelector('.form__input--user');
const inputClosePin = document.querySelector('.form__input--pin');

let currentUser;
let isSorted = false;
let timerRunning;

//Functions
const createUsernames = function (accs) {
  accs.forEach(function (acc) {
    acc.user = acc.owner
      .toLowerCase()
      .split(' ')
      .map(name => name[0])
      .join('');
  });
};

const separateDeposits = function (accs) {
  accs.forEach(function (acc) {
    acc.deposits = acc.movements.filter(mov => mov > 0);
  });
};

const separateWithdrawals = function (accs) {
  accs.forEach(function (acc) {
    acc.withdrawals = acc.movements.filter(mov => mov < 0);
  });
};

const createBalance = function (accs) {
  accs.forEach(function (acc) {
    acc.balance = acc.movements.reduce((acc, curr) => acc + curr, 0);
  });
};

const formatDate = function (date) {
  const now = new Date();
  const movementDate = new Date(date);
  let formattedDate;
  console.log(daysPassed(movementDate, now));
  if (daysPassed(movementDate, now) === 0) {
    formattedDate = `today`;
  } else {
    formattedDate =
      daysPassed(movementDate, now) > 5
        ? `${new Intl.DateTimeFormat(currentUser.locale).format(movementDate)}`
        : `${daysPassed(movementDate, now)} days ago`;
  }
  return formattedDate;
};

const checkLogin = function () {
  const acc = accounts.find(
    account => account.user === inputLoginUsername.value
  );
  if (acc) {
    labelWelcome.textContent = `Welcome, ${acc?.owner}.`;
    const now = new Date();
    const date = new Intl.DateTimeFormat(acc.locale).format(now);
    labelDate.textContent = `As of ${date}`;
    containerApp.classList.remove('hidden');
    inputLoginUsername.value = '';
    inputLoginPin.value = '';
    inputCloseUsername.value = '';
    inputClosePin.value = '';
    return acc;
  }
};

const displayMovements = function (movements, sort = false) {
  containerMovements.innerHTML = '';
  const movs = sort ? movements.slice().sort((a, b) => a - b) : movements;
  movs.forEach(function (mov, i) {
    let type = mov > 0 ? 'deposit' : 'withdrawal';
    let formattedMov = new Intl.NumberFormat(currentUser.locale, {
      style: 'currency',
      currency: currentUser.currency,
    }).format(mov);

    let html = `<div class="movements__row">
      <div class="info">
        <div class="movements__type movements__type--${type}">
          ${i + 1} ${type}
        </div>
        <div class="movements__date">${formatDate(
          currentUser.movementsDates[i]
        )}</div>
      </div>
      <div class="movements__value">${formattedMov}</div>
    </div>`;
    containerMovements.insertAdjacentHTML('afterbegin', html);
  });
};
const prepareApp = function (currentUser) {
  let summaryIn = 0;
  let summaryOut = 0;
  (currentUser?.movements).forEach(function (mov, i) {
    mov > 0 ? (summaryIn += Number(mov)) : (summaryOut += Number(mov));
  });
  displayMovements(currentUser.movements);
  labelBalance.textContent = `${new Intl.NumberFormat(currentUser.locale, {
    style: 'currency',
    currency: currentUser.currency,
  }).format(currentUser.balance)}`;
  labelSumIn.textContent = `${Math.round(summaryIn)}$`;
  labelSumOut.textContent = `${Math.round(summaryOut)}$`;
  labelSumInterest.textContent = `${Math.trunc(
    summaryIn * (currentUser.interestRate / 100)
  )}$`;
};

const transferAccount = function () {
  const transferUser = String(inputTransferTo.value);
  return accounts.find(acc => acc.user === transferUser);
};

const transferAmount = function (transferAcc) {
  const transferValue = Number(inputTransferAmount.value);
  if (
    transferValue > 0 &&
    transferAcc != currentUser &&
    transferAcc &&
    transferValue <= currentUser.balance
  ) {
    const movementDate = new Date().toISOString();
    currentUser.movementsDates.push(movementDate);
    currentUser?.movements.push(transferValue * -1);
    transferAcc?.movements.push(transferValue);
    prepareApp(currentUser);

    inputTransferAmount.value = '';
    inputTransferTo.value = '';
  }
};

const requestLoan = function () {
  const LoanValue = Number(inputLoanAmount.value);
  if (
    LoanValue > 0 &&
    currentUser.movements.some(mov => mov * 0.1 >= LoanValue)
  ) {
    const movementDate = new Date().toISOString();
    currentUser.movementsDates.push(movementDate);
    currentUser?.movements.push(LoanValue);
    prepareApp(currentUser);
    inputLoanAmount.value = '';
  }
};

const logOut = function () {
  currentUser = '';
  labelWelcome.textContent = 'Log in to get started';
  containerApp.classList.add('hidden');
};

const closeAccount = function () {
  if (
    inputCloseUsername.value === currentUser.user &&
    Number(inputClosePin.value) === currentUser.pin
  ) {
    const currentIndex = accounts.findIndex(
      acc => acc.user === currentUser.user
    );
    accounts.splice(currentIndex, currentIndex);
    inputCloseUsername.value = '';
    inputClosePin.value = '';
    logOut();
  }
};

const daysPassed = (date1, date2) =>
  Math.floor((date2 - date1) / (1000 * 60 * 60 * 24));

const startTimer = function () {
  let time = 5 * 60;
  const timer = setInterval(function () {
    let min = String(Math.floor(time / 60)).padStart(2, 0);
    let secs = String(time % 60).padStart(2, 0);
    if (time === 0) {
      logOut();
    }
    labelTimer.textContent = `${min}:${secs}`;
    time--;
  }, 1000);
  return timer;
};

//Code

createUsernames(accounts);
separateDeposits(accounts);
separateWithdrawals(accounts);
createBalance(accounts);

btnLogin.addEventListener('click', function (e) {
  e.preventDefault();
  currentUser = checkLogin();
  prepareApp(currentUser);
  if (timerRunning) clearInterval(timerRunning);
  timerRunning = startTimer();
});

btnTransfer.addEventListener('click', function (e) {
  e.preventDefault();
  transferAmount(transferAccount());
  clearInterval(timerRunning);
  timerRunning = startTimer();
});

btnLoan.addEventListener('click', function (e) {
  e.preventDefault();
  requestLoan();
  clearInterval(timerRunning);
  timerRunning = startTimer();
});

btnClose.addEventListener('click', function (e) {
  e.preventDefault();
  closeAccount();
});

btnSort.addEventListener('click', function (e) {
  e.preventDefault();
  if (isSorted === false) {
    isSorted = true;
    displayMovements(currentUser.movements, true);
  } else {
    isSorted = false;
    displayMovements(currentUser.movements, false);
  }
  clearInterval(timerRunning);
  timerRunning = startTimer();
});
