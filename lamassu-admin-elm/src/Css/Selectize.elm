module Css.Selectize exposing (..)

import Css exposing (..)
import Css.LocalColors as Colors
import Selectize
import Css.Admin exposing (className)
import Css.Elements exposing (input)
import Css.Classes as C

codeFonts : List String
codeFonts =
    [ "Inconsolata", "monospace" ]


component : Style
component =
    batch
        [ borderRadius (px 3)
        , position relative
        , margin zero
        , descendants
            [ class NoOptions
                [ backgroundColor Colors.lighterLightGrey
                , fontSize (px 14)
                , fontWeight (int 500)
                , color Colors.sandstone
                , padding (px 5)
                , textAlign center
                , cursor default
                , property "-webkit-user-select" "none"
                ]
            , class SelectBox
                [ displayFlex
                , alignItems center
                , padding2 zero (px 5)
                , property "background-color" "inherit"
                , width (px 60)
                ]
            , class BoxContainer
                [ position absolute
                , property "z-index" "100"
                , left (px -3)
                , backgroundColor Colors.white
                , textAlign left
                , fontWeight (int 500)
                , fontSize (pct 80)
                , borderRadius (px 3)
                , backgroundColor Colors.white
                , border3 (px 2) solid Colors.darkerLightGrey
                , borderTop zero
                , color Colors.sandstone
                , width (em 15)
                , cursor pointer
                , padding (px 5)
                ]
            , class BoxItems
                []
            , class BoxItemActive
                [ color Colors.cobalt
                , fontWeight (int 900)
                ]
            , class BoxItem
                [ padding2 (px 3) (px 6)
                , overflow hidden
                , textOverflow ellipsis
                ]
            , class Info
                [ padding2 (px 3) (px 6)
                , color Colors.darkGrey
                ]
            , class MultiItemContainer
                [ descendants
                    [ class SelectedItem
                        [ backgroundColor Colors.cobalt
                        , color Colors.white
                        , padding (px 2)
                        , margin2 zero (px 1)
                        , fontFamilies codeFonts
                        , fontSize (pct 70)
                        , fontWeight normal
                        , borderRadius (px 3)
                        ]
                    , class FallbackItem
                        [ backgroundColor Colors.amazonite
                        ]
                    ]
                ]
            , class SingleItemContainer
                [ descendants
                    [ class SelectedItem
                        [ fontFamilies codeFonts
                        , fontSize (px 14)
                        , padding zero
                        , borderRadius zero
                        ]
                    , class FallbackItem
                        [ color Colors.sandstone
                        ]
                    ]
                ]
            , class C.SelectizeLanguage
                [ descendants
                    [ class SelectBox
                        [ width (px 140)
                        ]
                    ]
                ]
            , class C.SelectizeCryptoCurrency
                [ descendants
                    [ class SelectBox
                        [ width (px 150)
                        ]
                    ]
                ]
            , input
                [ textAlign left
                , property "background-color" "inherit"
                , padding2 (px 6) (px 2)
                , width (em 6)
                , cursor default
                ]
            ]
        ]


type Class
    = SelectizeContainer
    | SelectBox
    | BoxItems
    | BoxItem
    | BoxItemActive
    | SelectedItems
    | FallbackItems
    | FallbackItem
    | SelectedItem
    | InputEditing
    | SingleItemContainer
    | MultiItemContainer
    | BoxContainer
    | Info
    | InfoNoMatches
    | NoOptions
    | Disabled


classes : Selectize.HtmlClasses
classes =
    { container = className SelectizeContainer
    , singleItemContainer = className SingleItemContainer
    , multiItemContainer = className MultiItemContainer
    , selectBox = className SelectBox
    , selectedItems = className SelectedItems
    , fallbackItems = className FallbackItems
    , fallbackItem = className FallbackItem
    , selectedItem = className SelectedItem
    , boxContainer = className BoxContainer
    , boxItems = className BoxItems
    , boxItem = className BoxItem
    , boxItemActive = className BoxItemActive
    , info = className Info
    , infoNoMatches = className InfoNoMatches
    , inputEditing = className InputEditing
    , noOptions = className NoOptions
    }
