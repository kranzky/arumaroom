ArumaRoom
=========

:boom:

Control light and music with your hands.

Installation
------------

```
> nvm use 7.8.0
> yarn global add quasar-cli
> yarn install
> quasar dev
```

Controls
--------

* Make fist to change sound volume by moving hand up and down
* Make an OK sign to draw a trail in the sky
* Pitch hands in opposite directions to rotate
* Roll hands in opposite directions to zoom
* Pitch/Roll hands in same direction to translate

Audio
-----

```
> ffmpeg -i name.mp3 -strict -2 name.webm
```

Copyright
---------

Copyright (c) 2017 Lloyd Kranzky. See UNLICENSE for further details.
