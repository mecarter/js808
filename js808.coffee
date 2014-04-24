# JS808

$window = $(window)

Tempo = Backbone.Model.extend(
    initialize: ->
        @playing = 0
        
        @on "change:playing", @togglePlay
        @on "change:tempo", @changeTempo

        @changeTempo 120

    togglePlay: ->
        tempoCounter = => setTimeout =>
            $window.trigger "beat", @beat || 0

            @beat++
            @beat = 0 if @beat is 16
            
            if @playing
                tempoCounter()
        , @get('bpm')

        @playing = not @playing

        if @playing
            @beat = 0
            tempoCounter()

    changeTempo: (bpm) ->
        @set bpm: 60000 / bpm / 4 # this.bpm = bpm in ms
        return
)

Drum = Backbone.Model.extend(
    initialize: (data) ->
        @el = data.el
        @beats = []
        @$audio = $("<audio />")
        
        @set "active", @el.hasClass "active"

        @$audio.attr('src', @get "file")

        @on "change:knob1 change:knob2", @setFile
        @on "change:isactive", @onActiveToggle
        @on "change:step", @onStepChange

        $window.on "beat", _.bind @onBeat, this

        @setFile()

    setFile: ->
        processVal = (val) ->
            switch val
                when 0 then val = "00"
                when 1 then val = "25"
                when 2 then val = "50"
                when 3 then val = "75"
                when 4 then val = "10"
                else val = ""
            return val

        knob1 = processVal(@get "knob1")
        knob2 = processVal(@get "knob2")
        knobsVal = "#{ knob1 }#{ knob2 }"

        @$audio.attr "src", "samples/#{@id}#{ knobsVal }.mp3"

    onBeat: (e, beat) ->
        if $.inArray(beat, @beats) >= 0
            @$audio[0].currentTime = 0
            @$audio[0].play()

    onActiveToggle: (drumId) ->
        isActive = @get "active"

        if isActive or drumId is @id
            @el.toggleClass "active", !isActive
            @set "active", !isActive

        if drumId is @id
            @setupBeats()
            

    onStepChange: (step) ->
        if $.inArray(step, @beats) >= 0
            @beats = _.without @beats, step
        else
            @beats.push step

    setupBeats: ->
        $('#sequencer button').each (i, e) =>
            beatIsActive = $.inArray(i, @beats) >= 0
            $(e).toggleClass "active", beatIsActive
)

Drums = Backbone.Collection.extend(model: Drum)

DrumMachine = Backbone.View.extend(
    el: $("#drum-machine")
    events:
        "change #tempo": "changeTempo"
        "click .drum": "drumActiveToggle"
        "click #controls button": "togglePlay"
        "click #sequencer button": "sequencerToggle"
        "change input[type=range]": "moveKnob"

    initialize: ->
        @tempo = new Tempo()
        @drums = new Drums()
        @$el.find(".drum").each _.bind(@createDrum, this)

    changeTempo: ->
        newBpm = +@$el.find("#tempo").val()
        @tempo.trigger "change:tempo", newBpm

    createDrum: (i, el) ->
        $drum = $(el)
        $knob1 = $drum.find ".knob1"
        $knob2 = $drum.find ".knob2"

        @drums.push [
            el: $drum
            id: $drum.attr "id"
            vol: $drum.find ".vol"
            knob1: +$knob1.val()
            knob2: +$knob2.val()
        ]

    togglePlay: ->
        @tempo.trigger "change:playing"
        return

    drumActiveToggle: (e) ->
        e.preventDefault()

        $drum = $(e.target).closest ".drum"
        return if $drum.hasClass "active"
        drumId = $drum.attr("id")

        @drums.each (drum) ->
            drum.trigger "change:isactive", drumId

        return

    sequencerToggle: (e) ->
        $toggle = $(e.target)
        step = $toggle.index()
        isActive = $toggle.hasClass "active"
        activeDrum = @drums.where(active: true)[0]

        if activeDrum
            $toggle.toggleClass 'active', !isActive
            activeDrum.trigger "change:step", step

        e.preventDefault()

    moveKnob: (e) ->
        $knob = $(e.target)
        activeDrum = @drums.where(active: true)[0]

        if activeDrum
            activeDrum.set $knob.attr("name"), +$knob.val()

        e.preventDefault()
)

drumMachine = new DrumMachine()
