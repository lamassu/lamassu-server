const ifNotNull = (value, valueIfNotNull) => {
  return value === null ? '' : valueIfNotNull
}

export { ifNotNull }
