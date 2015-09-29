function app() {
  /**
  *** [Constants]
  ***  - dictionary[]: from .csv for keyword searching 
  ***  - alphabet[]: current character set
  ***  - frequencies{}: mapping of characters to appearance frequency, out of 1000; adapted from alternate corpus
  ***  - decibans{}: calculated frequency (page 12)
  ***  - enc{{}}: encryption table
  ***  - dec{{}}: decryption table
  ***  - tur[][]: table of turing values
  ***
  ***  - sources{}: DOM elements
  ***  - sinks{}: DOM elements
  **/
  this.dictionary = [];
  this.alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
  this.frequencies = { 'A' : 80.4, 'B' : 14.8, 'C' : 33.4, 'D' : 38.2, 'E' : 124.9, 'F' : 24.0, 'G' : 18.7, 'H' : 50.5, 'I' : 75.7, 'J' : 1.6, 'K' : 5.4,  'L' : 40.7, 'M' : 25.1, 'N' : 72.3, 'O' : 76.4, 'P' : 21.4, 'Q' : 1.2,  'R' : 62.8, 'S' : 65.1, 'T' : 92.8, 'U' : 27.3, 'V' : 10.5, 'W' : 16.8, 'X' :  2.3, 'Y' : 16.6, 'Z' : 0.9 };
  this.decibans = {};
  this.enc = {};
  this.dec = {};
  this.tur = [];

  this.sources = {};
  this.sinks = {};

  /**
  *** Starts app; constant initialization, no parameters
  **/
  this.init = function() {
    this.sources = {
      ciphertext: document.getElementById('source-ciphertext'),
      table: document.getElementById('source-tableword'),
      turing: document.getElementById('source-length'),
      match: document.getElementById('source-regex'),
      keyword: document.getElementById('source-keyword'),
      plaintext: document.getElementById('source-plaintext'),
    }

    this.sinks = {
      table: document.getElementById('sink-table'),
      turing: document.getElementById('sink-turings'),
      length: document.getElementById('sink-length'),
      match: document.getElementById('sink-suggestions'),
      plaintext: document.getElementById('sink-decrypted'),
      ciphertext: document.getElementById('sink-encrypted'),
    }

    this.initTuring();
    this.buildTable();
    this.fetchDictionary();
    this.bindEvents();
  };

  /**
  *** Builds deciban frequencies from listing of frequencies
  **/
  this.initTuring = function() {
    for (var loc in this.frequencies) {
      this.frequencies[loc] /= 1000;
    }

    for (var loc in this.frequencies) {
      var tmp = (25 * this.frequencies[loc]) / (1 - this.frequencies[loc]);
      tmp = (20*Math.log(tmp)) / Math.log(10);
      this.decibans[parseInt(ord(loc) - ord('A'))] = parseInt(tmp);
    }
  };

  /**
  *** Loads dictionary from hardcoded url `assets/dictionary.csv`.
  *** Optional though; can technically be ignored.
  **/
  this.fetchDictionary = function() {
    var req = new XMLHttpRequest();
    var ref = this;
    req.open('GET', 'assets/dictionary.csv', true);
    req.onload = function() {
      if (req.status >= 200 && req.status < 400) {
        ref.dictionary = req.responseText.split(/[, \n]{1,3}/);
      } else {
        console.log('Bad status while loading dictionary: ' + req.status);
      }
    }

    req.onerror = function() {
      console.log('Error connecting to dictionary.');
    }

    req.send();
  };

  /**
  *** Builds Vigenere table; displays
  **/
  this.buildTable = function() {
    var tablearray = this.sources['table'].value == undefined ? [] : this.sources['table'].value.toUpperCase().replace(/[^A-Z]/g, '').split('');
    var pool = cloneArray(this.alphabet);
    var initial = [];
    for (var loc in tablearray) {
      var letter = tablearray[loc];
      var ploc = pool.indexOf(letter);

      if (ploc != -1) {
        pool.splice(ploc, 1);
        initial.push(letter);
      }
    }

    for (var loc in pool) {
      var letter = pool[loc];
      initial.push(letter);
    }

    /* object model for encryption and decryption */
    /* encrypt = { key: { plaintext: ciphertext, ... }, ... } */
    /* decrypt = { key: { ciphertext: plaintext, ... }, ... } */
    var working = cloneArray(initial);
    var text = "";

    for (var loc in initial) { 
      this.enc[initial[loc]] = mapToObject(initial, working);
      this.dec[initial[loc]] = mapToObject(working, initial);
      text += working.join(" ") + "<br>";

      var letter = working.shift();
      working.push(letter);
    }

    this.sinks['table'].innerHTML = text;
  };

  /**
  *** Builds regex from Turing results
  **/
  this.buildRegex = function() {
    var regex = '';
    for (var loc in this.tur) {
      var place = this.tur[loc];
      if (place.length == 1) {
        regex += place[0];
      } else if (place.length > 1) {
        regex += '[' + place.join('') + ']';
      } else {
        regex += '.';
      }
    }

    if (regex != Array(this.tur.length+1).join('.')) {
      this.sources['match'].value = regex.toString();
    }
  };

  /**
  *** Decryption method which updates decrypted text field
  **/
  this.decrypt = function() {
    var textarray = this.sources['ciphertext'].value.split('');
    var keyarray = this.sources['keyword'].value.toUpperCase().replace(/[^A-Z]/g, '').split('');
    var plaintext = "";
    var kloc = 0;
    for (var loc in textarray) {
      var character = textarray[loc].toUpperCase();
      var downcase = character == textarray[loc] ? false : true;

      if (this.alphabet.indexOf(character) != -1) {
        var letter = this.dec[keyarray[kloc]][character];

        if (downcase) {
          letter = letter.toLowerCase();
        }

        kloc = (kloc + 1) % keyarray.length;
        plaintext += letter;
      } else {
        plaintext += character;
      }
    }

    this.sinks['plaintext'].innerHTML = plaintext;
  };

  /**
  *** Encrypts to encrypted text field at bottom of page; not top source
  **/
  this.encrypt = function() {
    var textarray = this.sources['plaintext'].value.split('');
    var keyarray = this.sources['keyword'].value.toUpperCase().replace(/[^A-Z]/g, '').split('');
    var ciphertext = "";
    var kloc = 0;
    for (var loc in textarray) {
      var character = textarray[loc].toUpperCase();
      var downcase = character == textarray[loc] ? false : true;

      if (this.alphabet.indexOf(character) != -1) {
        var letter = this.enc[keyarray[kloc]][character];

        if (downcase) {
          letter = letter.toLowerCase();
        }

        kloc = (kloc + 1) % keyarray.length;
        ciphertext += letter;
      } else {
        ciphertext += character;
      }
    }

    this.sinks['ciphertext'].innerHTML = ciphertext;
  };
   
  /**
  *** Turing method's, enclosed to display as well
  **/
  this.turing = function() {
    var textarray = this.sources['ciphertext'].value.toUpperCase().replace(/[^A-Z]/g, '').split('');
    var width = this.sources['turing'].value.replace(/[^0-9]/g, '') == undefined ? 10 : parseInt(this.sources['turing'].value.replace(/[^0-9]/g, ''));

    this.sinks['turing'].innerHTML = '';

    this.tur = [];
    for (var col = 0; col < width; col++) {
      this.tur.push([]);
    }

    for (var lid in this.alphabet) {
      var letter = this.alphabet[lid];
      this.sinks['turing'].innerHTML += letter + ': '; 

      for (var col = 0; col < width; col++) {
        var place = col;
        var evidence = 0;
        while (place < textarray.length) {
          var diff = ord(this.dec[letter][textarray[place]]) - ord('A');
          evidence += this.decibans[diff];
          place += width;
        }

        evidence = parseInt(evidence);

        if (evidence > 0) {
          var spaces = Array(4 - evidence.toString().length).join(' ');

          this.sinks['turing'].innerHTML += " " + spaces + evidence + " ";
          this.tur[col].push(letter);
        } else {
          this.sinks['turing'].innerHTML += "   . ";
        }
      }
      this.sinks['turing'].innerHTML += "\n";
    }

    this.buildRegex();
  };

  /**
  *** Checks for regex in wordlist
  **/
  this.match = function() {
    var regex = this.sources['match'].value.toString();
    var re = new RegExp(regex, 'i');
    var width = this.sources['turing'].value.replace(/[^0-9]/g, '') == undefined ? 10 : parseInt(this.sources['turing'].value.replace(/[^0-9]/g, ''));
    this.sinks['match'].innerHTML = '';

    if (regex != '') {
      for (var loc in this.dictionary) {
        if (this.dictionary[loc].length == width) {
          if (this.dictionary[loc].match(re)) {
            this.sinks['match'].innerHTML += ' ' + this.dictionary[loc];
          }
        }
      }
    }
  };

  /**
  *** Helper handlers fro change events
  **/
  this.eventHandleDecryption = function(event) {
    if (this.sources['keyword'].value.toUpperCase().replace(/[^A-Z]/g, '') != '' && this.sources['ciphertext'].value != '') {
      this.decrypt(); 
    } else {
      this.sinks['plaintext'].innerHTML = '&nbsp;';
    }
  };

  this.eventHandleEncryption = function(event) {
    if (this.sources['keyword'].value != '' && this.sources['plaintext'].value != '') {
      this.encrypt(); 
    } else {
      this.sinks['ciphertext'].innerHTML = '&nbsp;';
    }
  };

  this.eventHandleTable = function(event) {
    this.buildTable();
  };

  this.eventHandleTuring = function(event) {
    if (this.sources['turing'].value.replace(/[^0-9]/g, '') != '' && this.sources['ciphertext'].value != '') {
      this.turing();
      this.match();
    } else {
      this.sinks['turing'].innerHTML = '&nbsp;';
      this.sources['match'].value = '';
      this.sinks['match'].innerHTML = '&nbsp;';
    }
  };

  this.eventHandleMatch = function(event) {
    if (this.sources['match'].value != '') {
      this.match();
    } else {
      this.sinks['match'].innerHTML = '&nbsp;';
    }
  };

  /**
  *** Binds and unbinds events
  **/
  this.bindEvents = function() {
    this.unbindEvents();

    this.sources['table'].addEventListener('change', this.eventHandleTable.bind(this));

    this.sources['keyword'].addEventListener('change', this.eventHandleDecryption.bind(this));
    this.sources['ciphertext'].addEventListener('change', this.eventHandleDecryption.bind(this));

    this.sources['keyword'].addEventListener('change', this.eventHandleEncryption.bind(this));
    this.sources['plaintext'].addEventListener('change', this.eventHandleEncryption.bind(this));

    this.sources['turing'].addEventListener('change', this.eventHandleTuring.bind(this));
    this.sources['ciphertext'].addEventListener('change', this.eventHandleTuring.bind(this));

    this.sources['match'].addEventListener('change', this.eventHandleMatch.bind(this));
  };

  this.unbindEvents = function() {
    this.sources['table'].removeEventListener('change', this.eventHandleTable.bind(this));

    this.sources['keyword'].removeEventListener('change', this.eventHandleDecryption.bind(this));
    this.sources['ciphertext'].removeEventListener('change', this.eventHandleDecryption.bind(this));

    this.sources['keyword'].removeEventListener('change', this.eventHandleEncryption.bind(this));
    this.sources['plaintext'].removeEventListener('change', this.eventHandleEncryption.bind(this));

    this.sources['turing'].removeEventListener('change', this.eventHandleTuring.bind(this));
    this.sources['ciphertext'].removeEventListener('change', this.eventHandleTuring.bind(this));

    this.sources['match'].removeEventListener('change', this.eventHandleMatch.bind(this));
  };
}
