$(function() {
  
  var $window = $(window);
  
  var Tempo = Backbone.Model.extend({
    initialize: function() {      
      this.on('change:playing', this.togglePlay);
      this.on('change:tempo', this.changeTempo);
    },
    togglePlay: function() {
      var _this = this;
      var tempoCounter = function() {
        setTimeout(function() {
          $window.trigger('beat', _this.beat || 0);
          _this.beat++
          if (_this.beat === 16) _this.beat = 0;
          if (_this.get('playing')) tempoCounter();
        }, _this.get('bpm'))
      };

      if (this.get('playing')) {
        this.beat = 0;
        tempoCounter();
      }
    },
    changeTempo: function() {
      this.set('bpm', 60000 / this.get('tempo') / 4); // this.get('bpm') = bpm in ms
    }
  });
  
  var DrumModel = Backbone.Model.extend({
    initialize: function() {
      this.beats = [];
      this.$audio = $('<audio />');
      
      this.on('change:knob1 change:knob2', this.setFile);
      this.on('change:vol', this.setVol);
      
      $window.on('beat', _.bind(this.onBeat, this));
    },
    setFile: function() {
      var processVal = function(val) {
        var processedVal;
        switch(val) {
          case 0:
            processedVal = '00';
            break;
          case 1:
            processedVal = '25';
            break;
            case 2:
              processedVal = '50';
              break;
            case 3:
              processedVal = '75';
              break;
            case 4:
              processedVal = '10';
              break;
            default:
              processedVal = '';
        }
        return processedVal;
      };

      var knob1 = processVal(this.get('knob1'));
      var knob2 = processVal(this.get('knob2'));
      var knobsVal = '' + knob1 + knob2;
      var fileName = 'samples/' + this.get('drumId') + knobsVal + '.mp3';
      
      this.$audio.attr('src', fileName);
    },
    onBeat: function(e, beat) {
      if ($.inArray(beat, this.beats) >= 0) {
        if (this.$audio[0].readyState)
          this.$audio[0].currentTime = 0;
        this.$audio[0].play();
      }
    }
  });
  
  var Drums = Backbone.Collection.extend({
    model: DrumModel
  });
  
  var Drum = Backbone.View.extend({
    events: {
      'change .knob1': 'changeKnob',
      'change .knob2': 'changeKnob'
    },
    initialize: function() {
      this.$el = $('#' + this.model.get('id'));
      this.$knob1 = this.$('.knob1');
      this.$knob2 = this.$('.knob2');
      
      this.model.set('knob1', +this.$knob1.val());
      this.model.set('knob2', +this.$knob2.val());
    },
    changeKnob: function(e) {
      var $knob = $(e.target);
      this.model.set($knob.attr('class'), +$knob.val());
    }
  });
  
  var DrumMachine = Backbone.View.extend({
    el: $('#drum-machine'),
    events: {
      'click #play': 'togglePlay',
      'change #tempo': 'changeTempo'
    },
    initialize: function() {
      this.tempo = new Tempo();
      this.drums = new Drums();
      this.$tempo = this.$('#tempo');
      
      this.listenTo(this.drums, 'add', this.addDrum);
      
      this.tempo.set('tempo', +this.$tempo.val());
      this.$('.drum').each(_.bind(this.createDrum, this));
    },
    togglePlay: function(e) {
      $(e.target).closest('#play').toggleClass('playing');
      this.tempo.set('playing', !this.tempo.get('playing'));
    },
    changeTempo: function(e) {
      this.tempo.set('tempo', +$(e.target).val());
    },
    addDrum: function(drum) {
      var view = new Drum({ model: drum });
    },
    createDrum: function(k, drum) {
      var fullId = $(drum).attr('id');
      var splitId = fullId.split('_');
      var drumId = splitId[0];
      var drumAltId = splitId[1];
      
      this.drums.add([{
        id: fullId,
        drumId: drumId,
        drumAltId: drumAltId
      }]);
    }
  });
  
  var drumMachine = new DrumMachine();
  
});