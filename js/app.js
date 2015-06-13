"use strict";

function app() {
  this.dictionary = [];
  this.alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
  
  this.encrypt = {};
  this.decrypt = {};
  this.turing = {};
  this.sources = {};
  this.sinks = {};
  
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
    
    this.buildTable();
    this.fetchDictionary();
    this.bindEvents();
  };
  
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
  
  this.buildTable = function() {
    var tablearray = this.sources['table'].value == undefined ? [] : this.sources['table'].value.toUpperCase().replace(/[^A-Z]/g, '').split('');
    var pool = this.cloneArray(this.alphabet);
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
    
    /* encrypt = { key: { plaintext: ciphertext, ... }, ... } */
    /* decrypt = { key: { ciphertext: plaintext, ... }, ... } */
    var working = this.cloneArray(initial);
    var text = "";
    
    for (var loc in initial) {
      this.encrypt[initial[loc]] = this.mapToObject(initial, working);
      this.decrypt[initial[loc]] = this.mapToObject(working, initial);
      text += working.join(" ") + "<br>";
      
      var letter = working.shift();
      working.push(letter);
    }
    
    this.sinks['table'].innerHTML = text;
  };
  
  this.turing = function() {
    var textarray = this.sources['ciphertext'].value.split('');
    
  }
  
  this.decrypt = function() {
    var textarray = this.sources['ciphertext'].value.split('');
    var keyarray = this.sources['keyword'].value.toUpperCase().replace(/[^A-Z]/g, '').split('');
    var plaintext = "";
    var kloc = 0;
    for (var loc in textarray) {
      var character = textarray[loc].toUpperCase();
      var downcase = character == textarray[loc] ? false : true;
      
      if (this.alphabet.indexOf(character) != -1) {
        var letter = this.decrypt[keyarray[kloc]][character];
        
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
  
  this.encrypt = function() {
    var textarray = this.sources['plaintext'].value.split('');
    var keyarray = this.sources['keyword'].value.toUpperCase().replace(/[^A-Z]/g, '').split('');
    var ciphertext = "";
    var kloc = 0;
    for (var loc in textarray) {
      var character = textarray[loc].toUpperCase();
      var downcase = character == textarray[loc] ? false : true;
      
      if (this.alphabet.indexOf(character) != -1) {
        var letter = this.encrypt[keyarray[kloc]][character];
        
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
  
  this.bindEvents = function() {
    this.unbindEvents();
    
    this.sources['table'].addEventListener('change', this.eventHandleTable.bind(this));
    this.sources['keyword'].addEventListener('change', this.eventHandleDecryption.bind(this));
    this.sources['ciphertext'].addEventListener('change', this.eventHandleDecryption.bind(this));
    this.sources['keyword'].addEventListener('change', this.eventHandleEncryption.bind(this));
    this.sources['plaintext'].addEventListener('change', this.eventHandleEncryption.bind(this));
  };
  
  this.unbindEvents = function() {
    this.sources['table'].removeEventListener('change', this.eventHandleTable.bind(this));
    this.sources['keyword'].removeEventListener('change', this.eventHandleDecryption.bind(this));
    this.sources['ciphertext'].removeEventListener('change', this.eventHandleDecryption.bind(this));
    this.sources['keyword'].removeEventListener('change', this.eventHandleEncryption.bind(this));
    this.sources['plaintext'].removeEventListener('change', this.eventHandleEncryption.bind(this));
  };
  
  this.mapToObject = function(first, second) {
    if (first.length != second.length) {
      throw "Length of arrays don't match.";
    } else {
      var ret = {};
      for (var loc in first) {
        ret[first[loc]] = second[loc];
      }
      
      return ret;
    }
  };
  
  this.cloneArray = function(initial) {
    var ret = [];
    for (var loc in initial) {
      ret[loc] = initial[loc];
    }
    return ret;
  };
}