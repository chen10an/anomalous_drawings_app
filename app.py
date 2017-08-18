#libraries
from flask import Flask, render_template, request, jsonify
import numpy as np
import tensorflow as tf
# import pickle

# hide some tensorflow warnings
import os
os.environ['TF_CPP_MIN_LOG_LEVEL']='2'

# model file
from model import Autoencoder

# no need for a proper input because the model does not need to be trained
PLACEHOLDER = np.zeros((1,784))
MODEL = Autoencoder(PLACEHOLDER, PLACEHOLDER)
MODEL.saver.restore(MODEL.sess, "bowtie_model/model.ckpt")

app = Flask(__name__)

@app.route('/')
def showCanvas():
    return render_template('index.html')

@app.route('/model', methods=['POST'])
def runModel():
    imgDict = request.form
    imgFlat = []
    for i in range(len(imgDict)):
        imgFlat.append(imgDict[str(i)])
    imgFlat = np.array(imgFlat).astype('float32')

    # convert rgba to grayscale
    imgGray = []
    for i in range(0,len(imgFlat),4):
        # r = imgFlat[i]
        # g = imgFlat[i+1]
        # b = imgFlat[i+2]
        # a = imgFlat[i+3]
        # seems like only the alpha channel matters for
        # black and white images
        imgGray.append(imgFlat[i+3])

    X = np.expand_dims(np.array(imgGray), axis=0)/255

    # save current image for debugging purposes:
    # pickle.dump(X, open('temp.pickle', 'wb'))

    c = str(MODEL.sess.run(MODEL.cost, {MODEL.X:X}))
    r = MODEL.sess.run(MODEL.decoder, {MODEL.X:X})
    r = [str(i) for i in r.flatten()]
    ret = jsonify(cost=c, reconstruction=r)
    return ret
