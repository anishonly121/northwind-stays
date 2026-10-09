/* Northwind Stays: shared script for every page. Fictional demo site, no network calls. */
(function () {
  'use strict';

  const BUILD = '{{version}}';
  const KEY_PREFIX = 'northwind:';
  const NS = KEY_PREFIX + BUILD + ':';
  const TEST_USER = 'tester@northwind.test';
  const ACCOUNTS = {
    'tester@northwind.test': { password: 'Test@1234', locked: false },
    'locked@northwind.test': { password: 'Test@1234', locked: true }
  };
  const OTP_CODE = '123456';
  const FIRST_REFERENCE = 100001;
  const DAY_MS = 86400000;

  const TEXT = {
    badLogin: 'Incorrect email or password.',
    locked: 'This account is locked. Please contact support.',
    badCode: 'That code is incorrect. Please try again.',
    loggedOut: 'You have been logged out.',
    resetDone: 'Demo data has been reset.',
    dateFormat: 'Enter dates as DD/MM/YYYY.',
    dateOrder: 'Check-out must be after check-in.',
    datePast: 'Check-in date cannot be in the past.',
    noResults: 'No properties match your filters.',
    incompleteSearch: 'This search is incomplete. Use Change search to start a new search.',
    propertyMissing: 'This property could not be found. Use Search to start a new search.',
    linkIncomplete: 'This link is incomplete. Use Search to start a new search.',
    bookingMissing: 'This booking could not be found. Use My bookings to see your bookings.',
    nameRequired: 'Enter your full name.',
    emailInvalid: 'Enter a valid email address.',
    mobileInvalid: 'Enter a valid Singapore mobile number.',
    noBookings: 'You have no bookings yet.',
    payment: 'Payment: Pay at property'
  };

  const DATA = window.NORTHWIND_DATA || { cities: [], amenities: [], properties: [] };
  const PROPERTIES = DATA.properties;

  /* ---------- storage (localStorage only, namespaced per build) ---------- */

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(NS + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(NS + key, JSON.stringify(value));
  }

  function remove(key) {
    localStorage.removeItem(NS + key);
  }

  function clearAllData() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.indexOf(KEY_PREFIX) === 0) keys.push(key);
    }
    keys.forEach(function (key) { localStorage.removeItem(key); });
  }

  function currentUser() {
    const session = read('session', null);
    return session && session.email ? session.email : null;
  }

  function signIn(email) {
    write('session', { email: email });
    remove('pending');
  }

  function signOut() {
    remove('session');
    remove('pending');
  }

  /* ---------- small helpers ---------- */

  function $(id) {
    return document.getElementById(id);
  }

  function showText(el, text) {
    el.textContent = text;
    el.hidden = false;
  }

  function hideText(el) {
    el.textContent = '';
    el.hidden = true;
  }

  function make(tag, attrs, text) {
    const node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (name) {
      node.setAttribute(name, attrs[name]);
    });
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function money(amount) {
    return 'S$' + String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function plural(n, one, many) {
    return n + ' ' + (n === 1 ? one : many);
  }

  function encodeValue(value) {
    return encodeURIComponent(String(value)).replace(/%2F/gi, '/');
  }

  function toQuery(values) {
    return Object.keys(values)
      .filter(function (k) { return values[k] !== undefined && values[k] !== null && values[k] !== ''; })
      .map(function (k) { return k + '=' + encodeValue(values[k]); })
      .join('&');
  }

  function findProperty(id) {
    for (let i = 0; i < PROPERTIES.length; i++) {
      if (PROPERTIES[i].id === id) return PROPERTIES[i];
    }
    return null;
  }

  function initials(name) {
    return name.split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join('');
  }

  function thumb(el, property) {
    el.textContent = initials(property.name);
    el.style.backgroundColor = property.color;
  }

  /* ---------- dates and stays ---------- */

  function parseDate(text) {
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(text || '').trim());
    if (!match) return null;
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const time = Date.UTC(year, month - 1, day);
    const check = new Date(time);
    if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
    return { serial: Math.round(time / DAY_MS), text: pad2(day) + '/' + pad2(month) + '/' + year };
  }

  function todaySerial() {
    const now = new Date();
    return Math.round(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS);
  }

  function wholeNumber(value, min, max) {
    if (!/^\d+$/.test(String(value || ''))) return null;
    const n = Number(value);
    return n >= min && n <= max ? n : null;
  }

  function readStay(params) {
    const checkin = parseDate(params.get('checkin'));
    const checkout = parseDate(params.get('checkout'));
    const guests = wholeNumber(params.get('guests'), 1, 6);
    const rooms = wholeNumber(params.get('rooms'), 1, 3);
    if (!checkin || !checkout || checkout.serial <= checkin.serial || guests === null || rooms === null) return null;
    return {
      city: params.get('city') || '',
      checkin: checkin.text,
      checkout: checkout.text,
      nights: checkout.serial - checkin.serial,
      guests: guests,
      rooms: rooms
    };
  }

  function stayValues(stay) {
    return { city: stay.city, checkin: stay.checkin, checkout: stay.checkout, guests: stay.guests, rooms: stay.rooms };
  }

  function stayTotal(pricePerNight, nights, rooms) {
    //#if v1
    return pricePerNight * nights * rooms;
    //#endif
    //#if v2
    return pricePerNight * nights;
    //#endif
  }

  /* ---------- page guard (runs before the page body is parsed) ---------- */

  const root = document.documentElement;
  const page = root.getAttribute('data-page');
  const params = new URLSearchParams(window.location.search);
  let halted = false;

  if (root.getAttribute('data-auth') === 'required') {
    if (params.get('as') === 'tester') {
      signIn(TEST_USER);
      params.delete('as');
      const rest = [];
      params.forEach(function (value, key) { rest.push(key + '=' + encodeValue(value)); });
      window.history.replaceState(null, '', window.location.pathname + (rest.length ? '?' + rest.join('&') : '') + window.location.hash);
    }
    if (!currentUser()) {
      halted = true;
      window.location.replace('login.html');
    }
  } else if (page === 'otp' && !read('pending', null)) {
    halted = true;
    window.location.replace('login.html');
  } else if (page === 'home') {
    halted = true;
    window.location.replace('login.html');
  }

  /* ---------- shared header ---------- */

  function initHeader() {
    const who = $('signed-in-as');
    if (who) who.textContent = 'Signed in as ' + currentUser();
    const logout = $('logout-button');
    if (logout) {
      logout.addEventListener('click', function () {
        signOut();
        window.location.href = 'login.html?logged_out=1';
      });
    }
  }

  /* ---------- login ---------- */

  function initLogin() {
    const message = $('login-message');
    if (params.get('reset') === '1') {
      clearAllData();
      showText(message, TEXT.resetDone);
    } else if (params.get('logged_out') === '1') {
      showText(message, TEXT.loggedOut);
    }

    $('login-form').addEventListener('submit', function (event) {
      event.preventDefault();
      const error = $('login-error');
      const email = $('email').value.trim().toLowerCase();
      const password = $('password').value;
      const account = Object.prototype.hasOwnProperty.call(ACCOUNTS, email) ? ACCOUNTS[email] : null;
      hideText(message);
      if (!account || account.password !== password) {
        showText(error, TEXT.badLogin);
        $('password').value = '';
        return;
      }
      if (account.locked) {
        showText(error, TEXT.locked);
        $('password').value = '';
        return;
      }
      hideText(error);
      write('pending', { email: email });
      window.location.href = 'otp.html';
    });
  }

  /* ---------- one-time code ---------- */

  function initOtp() {
    const pending = read('pending', null);
    $('otp-email').textContent = pending.email;
    $('otp-form').addEventListener('submit', function (event) {
      event.preventDefault();
      const input = $('otp-code');
      if (input.value.trim() !== OTP_CODE) {
        showText($('otp-error'), TEXT.badCode);
        input.value = '';
        return;
      }
      signIn(pending.email);
      window.location.href = 'search.html';
    });
  }

  /* ---------- search ---------- */

  function initSearch() {
    const city = $('city');
    DATA.cities.forEach(function (name) {
      city.appendChild(make('option', { value: name }, name));
    });

    if (DATA.cities.indexOf(params.get('city')) !== -1) city.value = params.get('city');
    if (params.get('checkin')) $('checkin').value = params.get('checkin');
    if (params.get('checkout')) $('checkout').value = params.get('checkout');
    if (wholeNumber(params.get('guests'), 1, 6) !== null) $('guests').value = params.get('guests');
    if (wholeNumber(params.get('rooms'), 1, 3) !== null) $('rooms').value = params.get('rooms');

    $('search-form').addEventListener('submit', function (event) {
      event.preventDefault();
      const error = $('search-error');
      const checkin = parseDate($('checkin').value);
      const checkout = parseDate($('checkout').value);
      if (!checkin || !checkout) {
        showText(error, TEXT.dateFormat);
        return;
      }
      if (checkout.serial <= checkin.serial) {
        showText(error, TEXT.dateOrder);
        return;
      }
      if (checkin.serial < todaySerial()) {
        showText(error, TEXT.datePast);
        return;
      }
      hideText(error);
      window.location.href = 'results.html?' + toQuery({
        city: city.value,
        checkin: checkin.text,
        checkout: checkout.text,
        guests: $('guests').value,
        rooms: $('rooms').value
      });
    });
  }

  /* ---------- results ---------- */

  function numberOrNull(value) {
    const text = String(value || '').trim();
    if (text === '') return null;
    const n = Number(text);
    return isFinite(n) ? n : null;
  }

  function checkedValues(group) {
    const boxes = document.querySelectorAll('input[data-filter-group="' + group + '"]');
    const values = [];
    boxes.forEach(function (box) { if (box.checked) values.push(box.value); });
    return values;
  }

  function readFilters() {
    const filters = {
      minPrice: numberOrNull($('filter-min-price').value),
      maxPrice: numberOrNull($('filter-max-price').value),
      stars: checkedValues('star').map(Number),
      types: checkedValues('type'),
      amenities: checkedValues('amenity')
    };
    //#if v2
    filters.freeCancellation = $('filter-free-cancellation').checked;
    //#endif
    return filters;
  }

  function matchesFilters(property, filters) {
    if (filters.minPrice !== null && property.price < filters.minPrice) return false;
    //#if v1
    if (filters.maxPrice !== null && property.price > filters.maxPrice) return false;
    //#endif
    //#if v2
    if (filters.maxPrice !== null && property.price >= filters.maxPrice) return false;
    //#endif
    if (filters.stars.length && filters.stars.indexOf(property.stars) === -1) return false;
    if (filters.types.length && filters.types.indexOf(property.type) === -1) return false;
    for (let i = 0; i < filters.amenities.length; i++) {
      if (property.amenities.indexOf(filters.amenities[i]) === -1) return false;
    }
    //#if v2
    if (filters.freeCancellation && !property.freeCancellation) return false;
    //#endif
    return true;
  }

  function resetFilterInputs() {
    $('filter-min-price').value = '';
    $('filter-max-price').value = '';
    //#if v1
    const groups = ['star', 'type', 'amenity'];
    //#endif
    //#if v2
    const groups = ['star', 'type', 'cancellation'];
    //#endif
    groups.forEach(function (group) {
      document.querySelectorAll('input[data-filter-group="' + group + '"]').forEach(function (box) {
        box.checked = false;
      });
    });
  }

  function sortProperties(list, mode) {
    const compare = {
      'price-asc': function (a, b) { return a.price - b.price; },
      'price-desc': function (a, b) { return b.price - a.price; },
      'rating-desc': function (a, b) { return b.rating - a.rating; }
    }[mode];
    return list
      .map(function (property) { return { property: property, order: PROPERTIES.indexOf(property) }; })
      .sort(function (a, b) {
        const primary = compare ? compare(a.property, b.property) : 0;
        return primary !== 0 ? primary : a.order - b.order;
      })
      .map(function (entry) { return entry.property; });
  }

  function countText(n) {
    if (n === 0) return TEXT.noResults;
    return n === 1 ? '1 property found' : n + ' properties found';
  }

  function stayLine(stay) {
    return [
      stay.city || 'All cities',
      stay.checkin + ' to ' + stay.checkout,
      plural(stay.nights, 'night', 'nights'),
      plural(stay.guests, 'guest', 'guests'),
      plural(stay.rooms, 'room', 'rooms')
    ].join(' · ');
  }

  function badge(text, testid) {
    return make('span', { class: 'badge', 'data-testid': testid }, text);
  }

  function propertyCard(property, stay) {
    const card = make('article', { class: 'card', 'data-testid': 'property-card', 'data-property-id': property.id });

    const art = make('div', { class: 'thumb', 'aria-hidden': 'true', 'data-testid': 'property-thumb' });
    thumb(art, property);

    const body = make('div', { class: 'card-body' });
    body.appendChild(make('h2', { class: 'card-title', 'data-testid': 'property-name' }, property.name));
    const meta = make('p', { class: 'meta' });
    meta.appendChild(make('span', { 'data-testid': 'property-city' }, property.city));
    meta.appendChild(document.createTextNode(' · '));
    meta.appendChild(make('span', { 'data-testid': 'property-type' }, property.type));
    body.appendChild(meta);
    const ratings = make('p', { class: 'meta' });
    ratings.appendChild(make('span', { 'data-testid': 'property-stars' }, property.stars + ' stars'));
    ratings.appendChild(document.createTextNode(' · Guest rating '));
    ratings.appendChild(make('span', { 'data-testid': 'property-rating' }, property.rating.toFixed(1) + '/10'));
    body.appendChild(ratings);
    body.appendChild(make('p', { class: 'amenities', 'data-testid': 'property-amenities' }, 'Amenities: ' + property.amenities.join(', ')));
    //#if v2
    if (property.freeCancellation) {
      const badges = make('p', { class: 'badges' });
      badges.appendChild(badge('Free cancellation', 'free-cancellation-badge'));
      body.appendChild(badges);
    }
    //#endif

    const side = make('div', { class: 'card-side' });
    side.appendChild(make('p', { class: 'price', 'data-testid': 'property-price' }, money(property.price) + ' per night'));
    const query = toQuery(Object.assign({ id: property.id }, stayValues(stay)));
    side.appendChild(make('a', { class: 'btn', href: 'details.html?' + query, 'data-testid': 'view-details' }, 'View details'));

    card.appendChild(art);
    card.appendChild(body);
    card.appendChild(side);
    return card;
  }

  function initResults() {
    const stay = readStay(params);
    if (!stay) {
      showText($('results-error'), TEXT.incompleteSearch);
      $('results-layout').hidden = true;
      return;
    }
    $('search-summary').textContent = stayLine(stay);
    $('change-search').href = 'search.html?' + toQuery(stayValues(stay));

    const matchingSearch = PROPERTIES.filter(function (property) {
      return (!stay.city || property.city === stay.city) && property.maxGuests >= stay.guests;
    });
    let filters = readFilters();

    function render() {
      const list = sortProperties(
        matchingSearch.filter(function (property) { return matchesFilters(property, filters); }),
        $('sort-by').value
      );
      $('result-count').textContent = countText(list.length);
      const container = $('results-list');
      container.textContent = '';
      list.forEach(function (property) { container.appendChild(propertyCard(property, stay)); });
    }

    $('filter-form').addEventListener('submit', function (event) {
      event.preventDefault();
      filters = readFilters();
      render();
    });
    $('clear-filters').addEventListener('click', function () {
      resetFilterInputs();
      filters = readFilters();
      render();
    });
    $('sort-by').addEventListener('change', render);
    render();
  }

  /* ---------- details ---------- */

  function initDetails() {
    const property = findProperty(params.get('id'));
    const stay = readStay(params);
    if (!property || !stay) {
      showText($('details-error'), property ? TEXT.linkIncomplete : TEXT.propertyMissing);
      return;
    }
    document.title = property.name + ' | Northwind Stays';
    $('back-to-results').href = 'results.html?' + toQuery(stayValues(stay));
    thumb($('property-thumb'), property);
    $('property-name').textContent = property.name;
    $('property-city').textContent = property.city;
    $('property-type').textContent = property.type;
    $('property-stars').textContent = property.stars + ' stars';
    $('property-rating').textContent = property.rating.toFixed(1) + '/10';
    $('property-price').textContent = money(property.price) + ' per night';
    $('property-description').textContent = property.description;
    $('property-max-guests').textContent = 'Sleeps up to ' + plural(property.maxGuests, 'guest', 'guests') + '.';
    const amenities = $('property-amenities');
    property.amenities.forEach(function (name) { amenities.appendChild(make('li', {}, name)); });
    //#if v2
    if (property.freeCancellation) $('property-badges').appendChild(badge('Free cancellation', 'free-cancellation-badge'));
    //#endif

    $('stay-checkin').textContent = 'Check-in: ' + stay.checkin;
    $('stay-checkout').textContent = 'Check-out: ' + stay.checkout;
    $('stay-nights').textContent = 'Nights: ' + stay.nights;
    $('stay-guests').textContent = 'Guests: ' + stay.guests;
    $('stay-rooms').textContent = 'Rooms: ' + stay.rooms;
    $('book-now').href = 'book.html?' + toQuery(Object.assign({ id: property.id }, stayValues(stay)));
    $('details-content').hidden = false;
  }

  /* ---------- book ---------- */

  function nextReference() {
    const next = read('refCounter', FIRST_REFERENCE - 1) + 1;
    write('refCounter', next);
    return 'NW-' + next;
  }

  function fieldMessage(id, text) {
    const el = $(id);
    if (text) showText(el, text);
    else hideText(el);
    return !text;
  }

  function initBook() {
    const property = findProperty(params.get('id'));
    const stay = readStay(params);
    if (!property || !stay) {
      showText($('book-error'), property ? TEXT.linkIncomplete : TEXT.propertyMissing);
      return;
    }
    const total = stayTotal(property.price, stay.nights, stay.rooms);

    $('summary-property').textContent = property.name;
    $('summary-price').textContent = money(property.price) + ' per night';
    $('summary-checkin').textContent = 'Check-in: ' + stay.checkin;
    $('summary-checkout').textContent = 'Check-out: ' + stay.checkout;
    $('summary-guests').textContent = 'Guests: ' + stay.guests;
    $('summary-nights').textContent = 'Nights: ' + stay.nights;
    $('summary-rooms').textContent = 'Rooms: ' + stay.rooms;
    $('summary-total').textContent = 'Total: ' + money(total);
    $('summary-payment').textContent = TEXT.payment;
    $('book-content').hidden = false;

    $('booking-form').addEventListener('submit', function (event) {
      event.preventDefault();
      const name = $('full-name').value.trim();
      const email = $('guest-email').value.trim();
      const mobile = $('mobile').value.trim();
      const okName = fieldMessage('full-name-error', name ? '' : TEXT.nameRequired);
      const okEmail = fieldMessage('guest-email-error', /^[^\s@]+@[^\s@]+$/.test(email) ? '' : TEXT.emailInvalid);
      const okMobile = fieldMessage('mobile-error', /^[89]\d{7}$/.test(mobile) ? '' : TEXT.mobileInvalid);
      if (!okName || !okEmail || !okMobile) return;

      const reference = nextReference();
      const bookings = read('bookings', []);
      bookings.push({
        reference: reference,
        propertyId: property.id,
        propertyName: property.name,
        city: property.city,
        checkin: stay.checkin,
        checkout: stay.checkout,
        nights: stay.nights,
        guests: stay.guests,
        rooms: stay.rooms,
        total: total,
        status: 'Confirmed',
        guestName: name,
        guestEmail: email,
        mobile: mobile,
        requests: $('special-requests').value.trim()
      });
      write('bookings', bookings);
      window.location.href = 'confirmation.html?ref=' + encodeValue(reference);
    });
  }

  /* ---------- confirmation ---------- */

  function findBooking(reference) {
    const bookings = read('bookings', []);
    for (let i = 0; i < bookings.length; i++) {
      if (bookings[i].reference === reference) return bookings[i];
    }
    return null;
  }

  function initConfirmation() {
    const booking = findBooking(params.get('ref'));
    if (!booking) {
      showText($('confirmation-error'), TEXT.bookingMissing);
      return;
    }
    $('booking-reference').textContent = 'Booking reference: ' + booking.reference;
    $('confirmation-property').textContent = booking.propertyName;
    $('confirmation-checkin').textContent = 'Check-in: ' + booking.checkin;
    $('confirmation-checkout').textContent = 'Check-out: ' + booking.checkout;
    $('confirmation-guests').textContent = 'Guests: ' + booking.guests;
    $('confirmation-nights').textContent = 'Nights: ' + booking.nights;
    $('confirmation-rooms').textContent = 'Rooms: ' + booking.rooms;
    $('confirmation-total').textContent = 'Total: ' + money(booking.total);
    $('confirmation-payment').textContent = TEXT.payment;
    $('confirmation-content').hidden = false;
  }

  /* ---------- my bookings ---------- */

  function initBookings() {
    function render() {
      const bookings = read('bookings', []);
      const body = $('bookings-body');
      body.textContent = '';
      $('bookings-empty').hidden = bookings.length > 0;
      $('bookings-table').hidden = bookings.length === 0;
      bookings.forEach(function (booking) {
        const row = make('tr', { 'data-testid': 'booking-row', 'data-reference': booking.reference });
        row.appendChild(make('td', { 'data-testid': 'booking-reference' }, booking.reference));
        row.appendChild(make('td', { 'data-testid': 'booking-property' }, booking.propertyName));
        row.appendChild(make('td', { 'data-testid': 'booking-dates' }, booking.checkin + ' to ' + booking.checkout));
        row.appendChild(make('td', { 'data-testid': 'booking-total' }, money(booking.total)));
        row.appendChild(make('td', { 'data-testid': 'booking-status' }, booking.status));
        const action = make('td', { 'data-testid': 'booking-action' });
        if (booking.status === 'Confirmed') {
          const button = make('button', { type: 'button', class: 'btn btn-secondary btn-small', 'data-testid': 'cancel-booking' }, 'Cancel booking');
          button.addEventListener('click', function () { cancel(booking.reference); });
          action.appendChild(button);
        }
        row.appendChild(action);
        body.appendChild(row);
      });
    }

    function cancel(reference) {
      const bookings = read('bookings', []);
      bookings.forEach(function (booking) {
        if (booking.reference === reference) booking.status = 'Cancelled';
      });
      write('bookings', bookings);
      showText($('bookings-message'), 'Booking ' + reference + ' has been cancelled.');
      render();
    }

    render();
  }

  /* ---------- start ---------- */

  const PAGES = {
    login: initLogin,
    otp: initOtp,
    search: initSearch,
    results: initResults,
    details: initDetails,
    book: initBook,
    confirmation: initConfirmation,
    bookings: initBookings
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (halted) return;
    initHeader();
    if (PAGES[page]) PAGES[page]();
  });
})();
