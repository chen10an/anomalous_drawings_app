#libraries
import numpy as np
import matplotlib.pyplot as plt

# function for plotting images
def plotImgs(X, n_examples, n_rows, figsize=(7,7), cmap=None):
    assert n_examples % n_rows == 0
    n_cols = n_examples/n_rows
    plt.figure(1, figsize=figsize)
    for i in range(n_examples):
        img = X[i]
        plt.subplot(n_rows, n_cols, i+1)
        plt.imshow(img, cmap=plt.get_cmap(cmap))
    plt.show()

# get data in random batches
def getRandBatch(X, batch_size):
    # np.random.shuffle(X)
    start = np.random.randint(0, X.shape[0] - batch_size)
    return X[start:start+batch_size, :], start
