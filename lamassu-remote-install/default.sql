COPY user_config (id, type, data) FROM stdin;
1	exchanges	{"exchanges" : {\
    "settings": {\
      "commission": 1.0,\
      "compliance": {\
        "maximum": {\
          "limit": null\
        }\
      }\
    },\
    "plugins" : {\
      "current": {\
        "ticker": "bitpay",\
        "transfer": "bitgo"\
      },\
      "settings": {\
        "bitpay": {},\
        "bitgo" : {}\
      }\
    }\
  }\
}
\.

COPY user_config (id, type, data) FROM stdin;
2	unit	{ "brain": {\
    "unit": {\
      "ssn": "xx-1234-45",\
      "owner": "Unlisted"\
    },\
    "locale": {\
      "currency": "USD",\
      "localeInfo": {\
        "primaryLocale": "en-US",\
        "primaryLocales": ["en-US"]\
      }\
    }\
  }\
}
\.
