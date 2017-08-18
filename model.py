# libraries
import numpy as np
import tensorflow as tf
from tqdm import tqdm

# file
import utils

class Autoencoder:
    def __init__(self, X_train, X_test, lr=0.01, epochs=20, batch_size=256,
    dtype=tf.float32, n_hidden=32, activate=tf.nn.sigmoid,
    optimizer=tf.train.AdamOptimizer, early_stop=3, log_file=''):
        # default params are for mnist data
        self.X_train = X_train
        self.X_test = X_test
        self.epochs = epochs
        self.batch_size = batch_size
        self.n_batch = int(X_train.shape[0]/batch_size)  # floor
        self.early_stop = early_stop
        n_in = X_train.shape[1]

        # build graph
        with tf.name_scope("weights"):
            self.weights = {
                'enc': tf.Variable(tf.random_normal([n_in, n_hidden]), dtype=dtype),
                'dec': tf.Variable(tf.random_normal([n_hidden, n_in]), dtype=dtype)
            }
        with tf.name_scope("biases"):
            self.biases = {
                'enc': tf.Variable(tf.random_normal([n_hidden]), dtype=dtype),
                'dec': tf.Variable(tf.random_normal([n_in]), dtype=dtype)
            }

        self.X = tf.placeholder(dtype, [None, n_in], "input")

        with tf.name_scope("model"):
            self.encoder = activate(tf.add(tf.matmul(self.X, self.weights['enc']), self.biases['enc']))
            self.decoder = activate(tf.add(tf.matmul(self.encoder, self.weights['dec']), self.biases['dec']))

        with tf.name_scope("optimization"):
            self.cost = tf.reduce_mean(tf.square(tf.subtract(self.X, self.decoder)), name='cost')  # MSE
            self.optimization = optimizer(lr).minimize(self.cost)

        # launch the graph in a session
        init = tf.global_variables_initializer()
        self.sess = tf.Session()
        self.sess.run(init)

        # new tf board event if log_file string is not empty
        if log_file:
            writer = tf.summary.FileWriter(log_file, graph=self.sess.graph)
        # saver for variables
        self.saver = tf.train.Saver()

    def train(self, model_file=''):
        print("\n Training model...")
        # run graph
        history_cost = []
        for e in range(self.epochs):
            X_temp = np.copy(self.X_train)
            for i in tqdm(range(self.n_batch)):
                batch, start = utils.getRandBatch(X_temp, self.batch_size)
                # X_temp = np.delete(X_temp, np.s_[start:start+batch_size], axis=0)
                _, c = self.sess.run([self.optimization, self.cost], {self.X: batch})

            cost_overall = self.sess.run(self.cost, {self.X:self.X_train})
            history_cost.append(cost_overall)

            if e % 1 == 0:
                print("epoch {}\tcost {}".format(e, cost_overall))

            # early stopping in terms of cost
            if e >= self.early_stop:
                if (np.argmin(history_cost) == e - self.early_stop) and \
                (history_cost[e] - history_cost[e - self.early_stop] > 1e-5):
                    print('early stop\nbest iteration: {}'.format(np.argmin(history_cost)))
                    break

        # save variables if model_file string is not empty
        if model_file:
            save_path = self.saver.save(self.sess, model_file)
            print("Model saved in file: {}".format(save_path))
