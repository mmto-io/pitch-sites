(() => {
  document.body.classList.add('js');
  const header = document.querySelector('.header');
  const toggle = header.querySelector('.nav-toggle');
  const navigation = header.querySelector('#main-navigation');
  const navRight = header.querySelector('.nav-right');
  const languages = [...navRight.querySelectorAll('[lang]')];
  const mobile = window.matchMedia('(max-width: 650px)');
  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';
  function closeNavigation(restoreFocus = true) {
    header.classList.remove('navigation-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
    if (restoreFocus) toggle.focus();
  }
  function updateNavigation() {
    const hadFocus = navigation.contains(document.activeElement) || document.activeElement === toggle;
    closeNavigation(false);
    languages.forEach(link => {
      if (mobile.matches) navigation.append(link);
      else navRight.insertBefore(link, navRight.querySelector('.nav-call'));
    });
    if (hadFocus) (mobile.matches ? toggle : navigation.querySelector('a')).focus();
  }
  toggle.addEventListener('click', () => {
    if (isOpen()) closeNavigation();
    else {
      header.classList.add('navigation-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close navigation');
      navigation.querySelector('a').focus();
    }
  });
  navigation.addEventListener('click', event => {
    if (mobile.matches && event.target.closest('a')) closeNavigation();
  });
  document.addEventListener('keydown', event => {
    if (!isOpen()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeNavigation();
    }
    if (event.key === 'Tab') {
      const links = [...navigation.querySelectorAll('a')];
      const controls = [toggle, ...links];
      const index = controls.indexOf(document.activeElement);
      event.preventDefault();
      controls[(index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length].focus();
    }
  });
  document.addEventListener('focusin', event => {
    if (isOpen() && event.target !== toggle && !navigation.contains(event.target)) {
      navigation.querySelector('a').focus();
    }
  });
  document.addEventListener('click', event => {
    if (isOpen() && !navigation.contains(event.target) && !toggle.contains(event.target)) closeNavigation();
  });
  mobile.addEventListener('change', updateNavigation);
  updateNavigation();
  document.querySelectorAll('[role="tablist"]').forEach(tablist => {
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    function select(tab, focus = false) {
      tabs.forEach(item => {
        const selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
        document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
      });
      if (focus) tab.focus();
    }
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next !== undefined) { event.preventDefault(); select(tabs[next], true); }
      });
    });
    select(tabs[0]);
  });
})();
