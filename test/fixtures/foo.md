<emu-clause id="sec-resolve" aoid="Resolve">

    <h1>Resolve(loader, name, referrer)</h1>

    When the abstract operation Resolve is called with arguments <i>loader</i>, <i>name</i> and <i>referrer</i>, the following steps are taken:

    <emu-alg>
    1. Assert: _loader_ must have all of the internal slots of a Loader Instance (<a href="#loader-internal-slots">3.5</a>).
    1. Assert: Type(_name_) is String.
    1. Assert: Type(_referrer_) is String.
    1. Let _hook_ be GetMethod(_loader_, @@resolve).
    1. Return the result of promise-calling _hook_(_name_, _referrer_).
    </emu-alg>

</emu-clause>



<emu-clause id="sec-todatetimeoptions" aoid="ToDateTimeOptions">

    <h1>ToDateTimeOptions (options, required, defaults)</h1>

    When the ToDateTimeOptions abstract operation is called with arguments _options_, _required_, and _defaults_, the following steps are taken:

    <emu-alg>
        1. If _options_ is *undefined*, let _options_ be *null*; otherwise let _options_ be ? ToObject(_options_).
        1. Let _options_ be ObjectCreate(_options_).
        1. Let _needDefaults_ be *true*.
        1. If _required_ is *"date"* or *"any"*,
          1. For each of the property names *"weekday"*, *"year"*, *"month"*, *"day"*:
            1. Let _prop_ be the property name.
            1. Let _value_ be ? Get(_options_, _prop_).
            1. If _value_ is not *undefined*, let _needDefaults_ be *false*.
        1. If _required_ is *"time"* or *"any"*,
          1. For each of the property names *"hour"*, *"minute"*, *"second"*:
            1. Let _prop_ be the property name.
            1. Let _value_ be ? Get(_options_, _prop_).
            1. If _value_ is not *undefined*, let _needDefaults_ be *false*.
        1. If _needDefaults_ is *true* and _defaults_ is either *"date"* or *"all"*, then
          1. For each of the property names *"year"*, *"month"*, *"day"*:
            1. Perform ? CreateDataPropertyOrThrow(_options_, _prop_, *"numeric"*).
        1. If _needDefaults_ is *true* and _defaults_ is either *"time"* or *"all"*, then
          1. For each of the property names *"hour"*, *"minute"*, *"second"*:
            1. Perform ? CreateDataPropertyOrThrow(_options_, _prop_, *"numeric"*).
        1. Return _options_.
    </emu-alg>
</emu-clause>
