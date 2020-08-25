import matplotlib.pyplot as plt
import numpy as np
import sys

if len(sys.argv) < 5:
    raise ValueError('No dates provided')

labels = sys.argv[1]
labels = labels.split(',')
# text == ['a', 'b', 'c']

joins = sys.argv[2]
joins = joins.split(',')

plt.rcdefaults()
plt.rcParams['text.color'] = '#99AAB5'
plt.rcParams['axes.labelcolor'] = '#99AAB5'
plt.rcParams['xtick.color'] = '#99AAB5'
plt.rcParams['ytick.color'] = '#99AAB5'
# how tall Y axis should be
y = np.arange(len(labels))

fig = plt.figure()
fig.patch.set_facecolor('#2C2F33')
plt.bar(y, [int(i) for i in joins], align='center', alpha=1, width=0.5, color='#7289DA', edgecolor='#000000', linewidth=2)
plt.xticks(y, labels)
plt.ylabel('Members')

ax = plt.gca()
ax.set_facecolor('#2C2F33')
plt.title('Discord Guild Insights')

plt.savefig(sys.argv[4] + sys.argv[3] + '.png')