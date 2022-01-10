import React, { useEffect, useRef, useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    background: #000;
  }
`;

const Heading = styled.h1`
  color: #777;
  font-weight: normal;
  font-size: 18px;
  font-family: 'Inconsolata', monospace;
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1000;
  margin: 0;
`;

const Input = styled.input`
  margin: 0;
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 10px;
  font-family: 'Inconsolata', monospace;
  color: #777;
  width: 220px;
  background: transparent;
  z-index: 1000;
  border: 1px solid #444;
  border-radius: 10px;
  transition: color 0.4s;
  font-size: 18px;

  &:focus {
    color: #fff;
  }

  &:before {
    content: 'Miner url:';
  }
`;

const Canvas = styled.canvas`
  position: fixed;
  top: 0;
  left: 0;
  padding: 20px;
`;

const Index = styled.div.attrs((props) => ({
  style: {
    top: props.top + 'px',
    left: props.left + 'px',
  },
}))`
  position: fixed;
  font-family: 'Inconsolata', monospace;
  color: yellow;
`;

const NUMBER_OF_NEURONS = 10000;

const App = function () {
  const canvas = useRef();
  const canvas2 = useRef();
  const canvas3 = useRef();
  const [currentIndex, setCurrentIndex] = useState(undefined);
  const [url, setUrl] = useState('http://localhost:21840');

  useEffect(
    function () {
      let listener;
      const ctx = canvas.current.getContext('2d');
      const ctx2 = canvas2.current.getContext('2d');
      const ctx3 = canvas3.current.getContext('2d');
      let structureCopy;

      const draw = function () {
        if (listener !== undefined) {
          document.body.removeEventListener('mousemove', listener);
        }

        fetch(url, { method: 'GET' })
          .then(function (response) {
            return response.arrayBuffer();
          })
          .then(function (data) {
            return new Uint32Array(data);
          })
          .then(function (data) {
            const referrers = new Map();
            const structure = Array(NUMBER_OF_NEURONS);

            for (let i = 0, j = 0; i < NUMBER_OF_NEURONS; i++) {
              structure[i] = [data[j], data[j + 1], data[j + 2]];
              structure[i].i = i;
              structure[i].state = false;

              if (i >= 54) {
                let ref1 = referrers.get(data[j]);
                if (ref1 === undefined) {
                  ref1 = [];
                }
                ref1.push(i);
                referrers.set(data[j], ref1);

                let ref2 = referrers.get(data[j + 1]);
                if (ref2 === undefined) {
                  ref2 = [];
                }
                ref2.push(i);
                referrers.set(data[j + 1], ref2);

                let ref3 = referrers.get(data[j + 2]);
                if (ref3 === undefined) {
                  ref3 = [];
                }
                ref3.push(i);
                referrers.set(data[j + 2], ref3);
              }
              j += 3;
            }

            ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);

            ctx.strokeStyle = '#444';
            ctx.lineWidth = 1;

            let i = structure.length - 1;
            let c = 1;
            let x = 0;
            let Y = 0;
            while (i >= 0) {
              for (let y = 0; y < c && i >= 0; y++) {
                i--;
              }
              x++;
              if (i < (structure.length - 1) / 2 + 3000) {
                if (i < (structure.length - 1) / 2) {
                  if (c > 1) {
                    c -= 1;
                  }
                }
              } else {
                c += 3;
              }
              if (c > Y) {
                Y = c;
              }
            }
            let X = x;

            i = structure.length - 1;
            c = 1;
            x = 0;
            while (i >= 0) {
              for (let y = 0; y < c && i >= 0; y++) {
                const neuron = structure[i--];
                neuron.x = window.innerWidth - 40 - x * ((window.innerWidth - 40) / X) - 10;
                neuron.y =
                  (window.innerHeight - 40) / 2 -
                  y * ((window.innerHeight - 40) / Y) +
                  ((c * (window.innerHeight - 40)) / Y + 0.4) / 2;
                ctx.beginPath();
                ctx.arc(neuron.x, neuron.y, 0.8, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.closePath();
              }
              x++;
              if (i < (structure.length - 1) / 2 + 3000) {
                if (i < (structure.length - 1) / 2) {
                  if (c > 1) {
                    c -= 1;
                  }
                }
              } else {
                c += 3;
              }
            }

            ctx.lineWidth = 0.03;
            for (let j = NUMBER_OF_NEURONS - 1; j >= 0; j--) {
              const neuron = structure[j];

              for (let k = 0; k < 3; k++) {
                if (neuron[k] !== 0) {
                  ctx.beginPath();
                  ctx.moveTo(neuron.x, neuron.y);
                  ctx.lineTo(structure[neuron[k]].x, structure[neuron[k]].y);
                  ctx.stroke();
                  ctx.closePath();
                }
              }
            }

            const nonAnalyzedNeurons = [structure[structure.length - 1]];
            const liveNeurons = [];
            const analyzedNeurons = new Set();
            let neuron;
            while ((neuron = nonAnalyzedNeurons.shift()) !== undefined) {
              if (!analyzedNeurons.has(neuron.i)) {
                analyzedNeurons.add(neuron.i);
                liveNeurons.push(neuron);
                neuron.state = true;
                for (let k = 0; k < 3; k++) {
                  nonAnalyzedNeurons.push(structure[neuron[k]]);
                }
              }
            }

            ctx.lineWidth = 1;
            ctx.fillStyle = 'red';
            ctx.strokeStyle = 'red';
            liveNeurons.forEach(function (neuron) {
              ctx.beginPath();
              ctx.arc(neuron.x, neuron.y, 1, 0, 2 * Math.PI);
              ctx.stroke();
              ctx.closePath();
            });

            let t0 = performance.now();
            let alpha = 0;
            let direction = 1;
            const animate = function () {
              ctx3.clearRect(0, 0, canvas3.current.width, canvas3.current.height);
              var t1 = performance.now();
              const dt = t1 - t0;
              if (direction === 1) {
                alpha += dt / 10000;
              } else {
                alpha -= dt / 10000;
              }
              liveNeurons.forEach(function (neuron) {
                if (neuron.state !== structureCopy?.[neuron.i].state) {
                  const gradient = ctx3.createRadialGradient(
                    neuron.x,
                    neuron.y,
                    0.8,
                    neuron.x,
                    neuron.y,
                    15
                  );
                  ctx3.fillStyle = gradient;
                  gradient.addColorStop(0, `rgba(255, 0, 0, ${alpha})`);
                  gradient.addColorStop(0.8, 'transparent');
                  ctx3.fillRect(neuron.x - 15, neuron.y - 15, 30, 30);
                }
              });
              if (direction === 1 && alpha >= 1) {
                direction = -1;
                t0 = performance.now();
              }
              if ((direction === 1 && alpha < 1) || (direction === -1 && alpha > 0)) {
                window.requestAnimationFrame(animate);
              } else {
                structureCopy = structure.slice().map(function (neuron) {
                  return { ...neuron };
                });
              }
            };
            animate();

            ctx.lineWidth = 0.1;
            liveNeurons.forEach(function (neuron) {
              if (neuron.i >= 54) {
                for (let k = 0; k < 3; k++) {
                  ctx.beginPath();
                  ctx.moveTo(neuron.x, neuron.y);
                  ctx.lineTo(structure[neuron[k]].x, structure[neuron[k]].y);
                  ctx.stroke();
                  ctx.closePath();
                }
              }
            });

            listener = function (event) {
              ctx2.clearRect(0, 0, canvas2.current.width, canvas2.current.height);
              for (let i = 0; i < NUMBER_OF_NEURONS; i++) {
                const neuron = structure[i];
                if (
                  Math.sqrt(
                    (neuron.x - event.pageX + 20) ** 2 + (neuron.y - event.pageY + 20) ** 2
                  ) <
                  (window.innerHeight - 40) / Y
                ) {
                  setCurrentIndex({ i, x: neuron.x, y: neuron.y });
                  const nonAnalyzedNeurons = [neuron];
                  const referencedNeurons = [];
                  const analyzedNeurons = new Set();
                  let neuron2;
                  while ((neuron2 = nonAnalyzedNeurons.shift()) !== undefined) {
                    if (!analyzedNeurons.has(neuron2.i)) {
                      analyzedNeurons.add(neuron2.i);
                      referencedNeurons.push(neuron2);
                      for (let k = 0; k < 3; k++) {
                        nonAnalyzedNeurons.push(structure[neuron2[k]]);
                      }
                    }
                  }

                  ctx2.lineWidth = 1;
                  ctx2.fillStyle = 'yellow';
                  ctx2.strokeStyle = 'yellow';
                  referencedNeurons.forEach(function (neuron) {
                    ctx2.beginPath();
                    ctx2.arc(neuron.x, neuron.y, 1, 0, 2 * Math.PI);
                    ctx2.stroke();
                    ctx2.closePath();
                  });

                  ctx2.lineWidth = 0.1;
                  referencedNeurons.forEach(function (neuron) {
                    if (neuron.i >= 54) {
                      for (let k = 0; k < 3; k++) {
                        ctx2.beginPath();
                        ctx2.moveTo(neuron.x, neuron.y);
                        ctx2.lineTo(structure[neuron[k]].x, structure[neuron[k]].y);
                        ctx2.stroke();
                        ctx2.closePath();
                      }
                    }
                  });

                  const nonAnalyzedNeurons2 = [i];
                  const referrerNeurons = [];
                  const analyzedNeurons2 = new Set();
                  let j;
                  while ((j = nonAnalyzedNeurons2.shift()) !== undefined) {
                    if (!analyzedNeurons2.has(j)) {
                      analyzedNeurons2.add(j);
                      referrerNeurons.push(structure[j]);

                      const referrers2 = referrers.get(j) || [];
                      for (let k = 0; k < referrers2.length; k++) {
                        nonAnalyzedNeurons2.push(referrers2[k]);
                      }
                    }
                  }

                  ctx2.lineWidth = 1;
                  ctx2.fillStyle = 'purple';
                  ctx2.strokeStyle = 'purple';
                  referrerNeurons.forEach(function (neuron) {
                    ctx2.beginPath();
                    ctx2.arc(neuron.x, neuron.y, 1, 0, 2 * Math.PI);
                    ctx2.stroke();
                    ctx2.closePath();
                  });

                  ctx2.lineWidth = 0.3;
                  referrerNeurons.forEach(function (neuron) {
                    const referrers2 = referrers.get(neuron.i) || [];
                    for (let k = 0; k < referrers2.length; k++) {
                      ctx2.beginPath();
                      ctx2.moveTo(neuron.x, neuron.y);
                      ctx2.lineTo(structure[referrers2[k]].x, structure[referrers2[k]].y);
                      ctx2.stroke();
                      ctx2.closePath();
                    }
                  });

                  ctx2.lineWidth = 1;
                  ctx2.fillStyle = 'cyan';
                  ctx2.strokeStyle = 'cyan';
                  referrerNeurons.forEach(function (neuron) {
                    if (neuron.state === true) {
                      ctx2.beginPath();
                      ctx2.arc(neuron.x, neuron.y, 1, 0, 2 * Math.PI);
                      ctx2.stroke();
                      ctx2.closePath();
                    }
                  });

                  ctx2.lineWidth = 0.3;
                  referrerNeurons.forEach(function (neuron) {
                    if (neuron.state == true) {
                      const referrers2 = referrers.get(neuron.i) || [];
                      for (let k = 0; k < referrers2.length; k++) {
                        if (structure[referrers2[k]].state === true) {
                          ctx2.beginPath();
                          ctx2.moveTo(neuron.x, neuron.y);
                          ctx2.lineTo(structure[referrers2[k]].x, structure[referrers2[k]].y);
                          ctx2.stroke();
                          ctx2.closePath();
                        }
                      }
                    }
                  });

                  ctx2.lineWidth = 3;
                  ctx2.fillStyle = 'white';
                  ctx2.strokeStyle = 'white';
                  ctx2.beginPath();
                  ctx2.arc(neuron.x, neuron.y, 1, 0, 2 * Math.PI);
                  ctx2.stroke();
                  ctx2.closePath();

                  break;
                } else {
                  ctx2.clearRect(0, 0, canvas2.current.width, canvas2.current.height);
                  setCurrentIndex(undefined);
                }
              }
            };

            document.body.addEventListener('mousemove', listener);
          })
          .catch(function (error) {
            console.log(error);
          });
      };

      draw();
      const interval = setInterval(draw, 2500);

      return function () {
        clearInterval(interval);
        if (listener !== undefined) {
          document.body.removeEventListener('mousemove', listener);
        }
      };
    },
    [url]
  );

  return (
    <>
      <GlobalStyle />
      <Heading>Structure of ANN trained by qubic miners.</Heading>
      <Input
        type="text"
        value={url}
        onChange={function (event) {
          setUrl(event.target.value);
        }}
      />
      <Canvas width={window.innerWidth - 40} height={window.innerHeight - 40} ref={canvas} />
      <Canvas width={window.innerWidth - 40} height={window.innerHeight - 40} ref={canvas2} />
      <Canvas width={window.innerWidth - 40} height={window.innerHeight - 40} ref={canvas3} />
      {currentIndex !== undefined && (
        <Index top={currentIndex.y + 40} left={currentIndex.x}>
          {currentIndex.i}
        </Index>
      )}
    </>
  );
};

export default App;
