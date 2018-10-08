module Css.ColorSchemes exposing (..)

import Css exposing (..)
import Css.LocalColors as Colors
import Css.Classes exposing (..)


type alias ColorScheme =
    { bg : Color
    , fg : Color
    , bgHover : Color
    , fgActive : Color
    , bgActive : Color
    }


darkGreyScheme : ColorScheme
darkGreyScheme =
    { bg = Colors.darkGrey
    , fg = Colors.sandstone
    , bgHover = Colors.darkerGrey
    , fgActive = Colors.amazonite
    , bgActive = Colors.darkerGrey
    }


darkerGreyScheme : ColorScheme
darkerGreyScheme =
    { bg = Colors.darkerGrey
    , fg = Colors.sandstone
    , bgHover = Colors.darkerGrey
    , fgActive = Colors.amazonite
    , bgActive = Colors.darkerGrey
    }


lightGreyScheme : ColorScheme
lightGreyScheme =
    { bg = Colors.darkerLightGrey
    , fg = Colors.sandstone
    , bgHover = Colors.lighterLightGrey
    , fgActive = Colors.sandstone
    , bgActive = Colors.lightGrey
    }


cobaltScheme : ColorScheme
cobaltScheme =
    { bg = Colors.cobalt
    , fg = Colors.white
    , bgHover = Colors.darkCobalt
    , fgActive = Colors.amazonite
    , bgActive = Colors.darkCobalt
    }


colorize : ColorScheme -> Style
colorize scheme =
    batch
        [ color scheme.fg
        , fontWeight bold
        , cursor pointer
        , backgroundColor scheme.bg
        , hover
            [ backgroundColor scheme.bgHover
            ]
        , active [ color scheme.fgActive ]
        , withClass Active
            [ color scheme.fgActive
            , backgroundColor scheme.bgActive
            ]
        ]
