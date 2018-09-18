computeIqr = require('compute-iqr');

module.exports = bucketize = (array) => {
  const iqr = computeIqr(array);
  if (array.length <= 1 || iqr === 0) {
    return array;
  }

  let
    minValue = array[0],
    maxValue = array[0];
  
  array.forEach(currentVal => {
    if (currentVal < minValue) { minValue = currentVal; }
    else if (currentVal > maxValue) { maxValue = currentVal; }
  });

  const bucketSize =  (2 * iqr / Math.pow(array.length, 1/3));
  const bucketCount = Math.floor((maxValue - minValue) / bucketSize) + 1;

  const allBuckets = new Array(bucketCount);
  
  for (let i = 0; i < allBuckets.length; i++) {
    allBuckets[i] = [];
  }
  
  array.forEach(currentVal => {
  	allBuckets[Math.floor((currentVal - minValue) / bucketSize)].push(currentVal);
  });

  return allBuckets;
}