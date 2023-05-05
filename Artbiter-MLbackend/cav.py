import sys
import os
from scipy import ndimage, misc
from six.moves import cPickle as pickle
import tensorflow as tf
import numpy as np
from sklearn.manifold import TSNE
import scipy.io
import argparse
import csv
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
from PIL import Image
import random
from sklearn import linear_model
from sklearn import metrics
import time

model = {}
vgg_layers = None
NUM_CHANNELS = [64, 128, 256, 512, 512]
LAYER_IM_SIZE = [224, 112, 56, 28, 14]
EMBED_SIZE = sum(map(lambda x:x*x, NUM_CHANNELS))
VGG_MODEL = 'imagenet-vgg-verydeep-19.mat'



def build_graph(graph, vgg_layers):
    global model

    # extract weights and biases for a given convolutional layer
    def weights_and_biases(layer_index):
        W = tf.constant(vgg_layers[0][layer_index][0][0][2][0][0])
        b = vgg_layers[0][layer_index][0][0][2][0][1]
        # need to reshape b since each element is wrapped in length 1 array
        b = tf.constant(np.reshape(b, (b.size)))
        layer_name = vgg_layers[0][layer_index][0][0][0][0]
        return W,b

    with graph.as_default():
        model['image'] = tf.placeholder(tf.float32, shape=(1, 224, 224, 3))
        W,b = weights_and_biases(0)
        model['conv1_1'] = tf.nn.conv2d(model['image'], W, [1,1,1,1], 'SAME') + b
        model['relu1_1'] = tf.nn.relu(model['conv1_1'])
        W,b = weights_and_biases(2)
        model['conv1_2'] = tf.nn.conv2d(model['relu1_1'], W, [1,1,1,1], 'SAME') + b
        model['relu1_2'] = tf.nn.relu(model['conv1_2'])
        model['pool1'] = tf.nn.avg_pool(model['relu1_2'], ksize=[1, 2, 2, 1], 
            strides=[1, 2, 2, 1], padding='SAME')
        W,b = weights_and_biases(5)
        model['conv2_1'] = tf.nn.conv2d(model['pool1'], W, [1,1,1,1], 'SAME') + b
        model['relu2_1'] = tf.nn.relu(model['conv2_1'])
        W,b = weights_and_biases(7)
        model['conv2_2'] = tf.nn.conv2d(model['relu2_1'], W, [1,1,1,1], 'SAME') + b
        model['relu2_2'] = tf.nn.relu(model['conv2_2'])
        model['pool2'] = tf.nn.avg_pool(model['relu2_2'], ksize=[1,2,2,1], 
            strides=[1,2,2,1], padding='SAME')
        W,b = weights_and_biases(10)
        model['conv3_1'] = tf.nn.conv2d(model['pool2'], W, [1,1,1,1], 'SAME') + b
        model['relu3_1'] = tf.nn.relu(model['conv3_1'])
        W,b = weights_and_biases(12)
        model['conv3_2'] = tf.nn.conv2d(model['relu3_1'], W, [1,1,1,1], 'SAME') + b
        model['relu3_2'] = tf.nn.relu(model['conv3_2'])
        W,b = weights_and_biases(14)
        model['conv3_3'] = tf.nn.conv2d(model['relu3_2'], W, [1,1,1,1], 'SAME') + b
        model['relu3_3'] = tf.nn.relu(model['conv3_3'])
        W,b = weights_and_biases(16)
        model['conv3_4'] = tf.nn.conv2d(model['relu3_3'], W, [1,1,1,1], 'SAME') + b
        model['relu3_4'] = tf.nn.relu(model['conv3_4'])
        model['pool3'] = tf.nn.avg_pool(model['relu3_4'], ksize=[1,2,2,1], 
            strides=[1,2,2,1], padding='SAME')
        W,b = weights_and_biases(19)
        model['conv4_1'] = tf.nn.conv2d(model['pool3'], W, [1,1,1,1], 'SAME') + b
        model['relu4_1'] = tf.nn.relu(model['conv4_1'])
        W,b = weights_and_biases(21)
        model['conv4_2'] = tf.nn.conv2d(model['relu4_1'], W, [1,1,1,1], 'SAME') + b
        model['relu4_2'] = tf.nn.relu(model['conv4_2'])
        W,b = weights_and_biases(23)
        model['conv4_3'] = tf.nn.conv2d(model['relu4_2'], W, [1,1,1,1], 'SAME') + b
        model['relu4_3'] = tf.nn.relu(model['conv4_3'])
        W,b = weights_and_biases(25)
        model['conv4_4'] = tf.nn.conv2d(model['relu4_3'], W, [1,1,1,1], 'SAME') + b
        model['relu4_4'] = tf.nn.relu(model['conv4_4'])
        model['pool4'] = tf.nn.avg_pool(model['relu4_4'], ksize=[1,2,2,1], 
            strides=[1,2,2,1], padding='SAME')
        W,b = weights_and_biases(28)
        model['conv5_1'] = tf.nn.conv2d(model['pool4'], W, [1,1,1,1], 'SAME') + b
        model['relu5_1'] = tf.nn.relu(model['conv5_1'])
        W,b = weights_and_biases(30)
        model['conv5_2'] = tf.nn.conv2d(model['relu5_1'], W, [1,1,1,1], 'SAME') + b
        model['relu5_2'] = tf.nn.relu(model['conv5_2'])
        W,b = weights_and_biases(32)
        model['conv5_3'] = tf.nn.conv2d(model['relu5_2'], W, [1,1,1,1], 'SAME') + b
        model['relu5_3'] = tf.nn.relu(model['conv5_3'])
        W,b = weights_and_biases(34)
        model['conv5_4'] = tf.nn.conv2d(model['relu5_3'], W, [1,1,1,1], 'SAME') + b
        model['relu5_4'] = tf.nn.relu(model['conv5_4'])
        model['pool5'] = tf.nn.avg_pool(model['relu5_4'], ksize=[1,2,2,1], 
            strides=[1,2,2,1], padding='SAME')

# read in image as array of pixels (RGB) and truncate to 224 x 224
def get_imarray(filename):
    array = ndimage.imread(filename, mode='RGB')
    array = np.asarray([misc.imresize(array, (224, 224))])
    # array = np.asarray([misc.imresize(array, (224, 224))])
    return array

def flattened_gram(imarray, session):
    grams = np.empty([EMBED_SIZE])    
    index = 0

    styles = {}
    
    for i in range(5):
        intermediate = session.run(model['conv' + str(i+1) + '_1'], 
                feed_dict={model['image']: imarray})
        # if i==3 or i==4:
        #     intermediate2 = session.run(model['relu' + str(i+1) + '_1'], 
        #         feed_dict={model['image']: imarray})
        #     intermediate2 = np.moveaxis(intermediate2, 3, 1)
        #     print(intermediate2.shape)
        #     styles['relu'+str(i+1)+'_1'] = intermediate2.tolist()
        grams[index:(NUM_CHANNELS[i]**2 + index)] = gram_matrix(
            intermediate, 
            NUM_CHANNELS[i], 
            LAYER_IM_SIZE[i]**2).flatten()
        index += NUM_CHANNELS[i]**2
        print(i, intermediate.shape)
    return grams

def images2embeddings(imarray, session, PCAmodel):
    # imarray = np.asarray([misc.imresize(imarray, (224, 224))])
    flattened_grams = []
    im_styles = []
    for ia in imarray:
        grams = flattened_gram(ia.reshape(1, ia.shape[0], ia.shape[1], ia.shape[2]), session)
        flattened_grams.append(grams)
    intermediate_embeddings = np.asarray(flattened_grams)
    print('yeah', intermediate_embeddings.shape)
    # print(len(intermediate_embeddings.shape))
    if len(intermediate_embeddings.shape)==1:
        intermediate_embeddings = intermediate_embeddings.reshape((1, intermediate_embeddings.shape[0]))
    return PCAmodel.transform(intermediate_embeddings)


def gram_matrix(F, N, M):
    # F is the output of the given convolutional layer on a particular input image
    # N is number of feature maps in the layer
    # M is the total number of entries in each filter
    Ft = np.reshape(F, (M, N))
    return np.dot(np.transpose(Ft), Ft)


def train_concepts(embedding_dict, random_sampled=None, dim=300, model_type='linear', alpha=.01, max_iter=1000, tol=1e-3):
    # create training dataset
    cavs = {}

    data = np.zeros((0, dim))
    labels = []
    label2text = []
    if random_sampled is not None:
        label2text.append('_random')
        data = np.append(data, random_sampled, axis=0)
        labels = [label2text.index('_random') for i in range(random_sampled.shape[0])]
         
    for concept in sorted(embedding_dict.keys()):
        label2text.append(concept)
        data = np.append(data, embedding_dict[concept], axis = 0)
        labels = labels + [label2text.index(concept) for a in embedding_dict[concept]]
    
    labels = np.asarray(labels)

    if model_type=='linear':
        lm = linear_model.SGDClassifier(alpha=alpha, max_iter=max_iter, tol=tol)
    elif model_type=='logistic':
        lm = linear_model.LogisticRegression()

    lm.fit(data, labels)
    label_pred = lm.predict(data)
    label_dec = lm.decision_function(data)
    num_classes = max(labels)+1
    acc = {}
    dec = {}
    num_correct = 0
    # print(labels, label_pred, label_dec)



    for class_id in range(num_classes):
        idx = (labels==class_id)
        dec[label2text[class_id]] = np.mean(label_dec[idx])


        acc[label2text[class_id]] = metrics.accuracy_score(label_pred[idx], labels[idx])
        num_correct += (sum(idx) *acc[label2text[class_id]]) 
    acc['overall'] = float(num_correct) / float(len(labels))

    # print(acc, dec)

    # conf = lm.decision_function()
    if len(lm.coef_)==1:
        for idx, l2t in enumerate(label2text):
            if idx==0 and l2t!='_random':
                cavs[l2t] = -1 * lm.coef_[0]
            elif idx==1:
                cavs[l2t] = lm.coef_[0]
    else:
        for idx, l2t in enumerate(label2text):
            cavs[l2t] = lm.coef_[idx]

    
    return cavs, lm, label2text, dec



class CAV(object):
    
    @staticmethod
    def default_hparams():
        """HParams used to train the CAV.

        you can use logistic regression or linear regression, or different
        regularization of the CAV parameters.

        Returns:
        TF.HParams for training.
        """
        return tf.contrib.training.HParams(model_type='linear', alpha=.01, max_iter=1000, tol=1e-3)

    def __init__(self, stored_arts, PCAmodel, tree, hparams=tf.contrib.training.HParams(model_type='linear', alpha=.01, max_iter=1000, tol=1e-3), save_path=None, acts={}):
        """Initialize CAV class.

        Used to store 1 set of CAVs. (related concepts only)

        If the user wants to create multiple CAVs that are not related each other, please create multiple CAV objects.

        Args:
        concepts: set of concepts used for CAV
        hparams: a parameter used to learn CAV
        save_path: where to save this CAV
        """
        self.acts= acts
        self.hparams = hparams
        self.save_path = save_path

        self.stored_arts = stored_arts
        self.PCAmodel = PCAmodel
        self.tree = tree
        self.cavs = {}

        self.lm = None

        

        

    def train_concept(self, sess):
        """
        
        Args: 
        acts: it is a dictionary. 
                key: concept strings that are trained together. 
                    There can be two cases:
                    when there is only one concept --> use random sampled images
                    when there are multiple concepts --> train using them
                object: a list of activations
        """
        start_time = time.time()
        data, labels, label2text = self.create_training_dataset(sess)
        if self.hparams.model_type == 'linear':
            lm = linear_model.SGDClassifier(alpha=self.hparams.alpha, max_iter=self.hparams.max_iter, tol=self.hparams.tol)
        elif self.hparams.model_type == 'logistic':
            lm = linear_model.LogisticRegression()
        else:
            raise ValueError('Invalid hparams.model_type: {}'.format(
                self.hparams.model_type))
        acc = self._train_lm(lm, data, labels, label2text)
        conf_cal_time = time.time()
        conf = lm.decision_function(self.tree.get_arrays()[0])
        print(conf_cal_time-time.time(), len(conf))
        # print(acc)
        print(len(lm.coef_))
        if len(lm.coef_) == 1:
            # if there were only two labels, the concept is assigned to label 0 by
            # default. So we flip the coef_ to reflect this.
            # check this
            for idx, l2t in enumerate(label2text):
                print(idx, l2t)
                if idx==0 and l2t!='_random':
                    self.cavs[l2t] = -1 * lm.coef_[0]
                elif idx==1:
                    self.cavs[l2t] = lm.coef_[0]
        else:
            for idx, l2t in enumerate(label2text):
                self.cavs[l2t] = lm.coef_[idx]
            # self.cavs = [c for c in lm.coef_]
            # self._save_cavs()
        self.lm = lm
        print('Execution time:', time.time()-start_time)
        print(self.cavs)



    def _train_lm(self, lm, x, y, labels2text):
        """Train a model to get CAVs.

        Modifies lm by calling the lm.fit functions. The cav coefficients are then
        in lm._coefs.

        Args:
        lm: An sklearn linear_model object. Can be linear regression or
            logistic regression. Must support .fit and ._coef.
        x: An array of training data of shape [num_data, data_dim]
        y: An array of integer labels of shape [num_data]
        labels2text: Dictionary of text for each label.

        Returns:
        Dictionary of accuracies of the CAVs.

        """
        # if you get setting an array element with a sequence, chances are that your
        # each of your activation had different shape - make sure they are all from
        # the same layer, and input image size was the same
        lm.fit(x, y)
        y_pred = lm.predict(x)
        print(y_pred)
        # get acc for each class.
        num_classes = max(y) + 1
        acc = {}
        num_correct = 0
        for class_id in range(num_classes):
        # get indices of all test data that has this class.
            idx = (y == class_id)
            acc[labels2text[class_id]] = metrics.accuracy_score(y_pred[idx], y[idx])
            # overall correctness is weighted by the number of examples in this class.
            num_correct += (sum(idx) * acc[labels2text[class_id]])
        acc['overall'] = float(num_correct) / float(len(y))
        tf.compat.v1.logging.info('acc per class %s' % (str(acc)))
        return acc

    def add_images_update_cav(self, images, labels, sess):
        # add image to the activation
        # print(images)
        embeddings = images2embeddings(images, sess, self.PCAmodel)

        for idx, embedding in enumerate(embeddings):
            if labels[idx] not in self.acts:
                self.acts[labels[idx]] = np.zeros((0, embeddings.shape[1]))

            self.acts[labels[idx]] = np.append(self.acts[labels[idx]], embedding.reshape((1, embedding.shape[0])), axis=0) 
        # print(self.acts)

        # update CAV
        self.train_concept(sess)
                

        
    # def imagedic2activations(self, imagedic):
    #     acts = []
    #     # turn images into activations
    #     for concept in imagedic:
    #         intermediate_embeddings = []
    #         acts[concept] = self.PCA()

    #     return np.asarray(acts)
        
    # def imagelist2activations(self, imagelist):
    #     acts = []
    #     # run model


    #     for  in imagelist:
    #         intermediate_embeddings = []
    #         acts[concept] = self.PCA()

    #     return np.asarray(acts)

    def create_training_dataset(self, sess):
        data = np.zeros((0, 300))
        labels = []
        label2text = []
        if len(self.acts.keys())==1:
            label2text.append('_random')
            # sample data
            sample_num = np.max([self.acts[list(self.acts.keys())[0]].shape[0], 10])
            print(self.tree.get_arrays()[0].shape)
            sampled = np.random.choice(self.tree.get_arrays()[0].shape[0], sample_num, replace=False)
            random_arts = self.tree.get_arrays()[0][sampled]
            # sampled_random_arts = random.sample(self.stored_arts, sample_num)
            # print(sampled_random_arts)
            # random_arts = np.asarray([get_imarray(os.path.join('../Data/wikiart',a)).reshape((224,224,3)) for a in sampled_random_arts])
            # print(random_arts.shape)
            # random_arts = images2emeddings(random_arts, sess, self.PCAmodel)
            # print(random_arts.shape)
            data = np.append(data, random_arts, axis=0)
            labels = [label2text.index('_random') for i in range(sample_num)]

        for concept in self.acts:
            label2text.append(concept)
            data = np.append(data, self.acts[concept], axis=0)
            labels = labels + [label2text.index(concept) for a in self.acts[concept]]
        print(data.shape, labels)
        return data, np.asarray(labels), label2text

def main():
    global vgg_layers
    vgg = scipy.io.loadmat(VGG_MODEL)
    vgg_layers = vgg['layers']
    print("VGG matrix loaded...")

    # build the tensorflow graph
    graph = tf.Graph()
    build_graph(graph)
    print("Tensorflow graph built...")
    del vgg # to free up memory

    # the list of stored arts
    stored_arts = pickle.load(open('final_artlist.pkl', 'rb'))

        # the PCA model
    PCAmodel = pickle.load(open('PCA_model.pkl', 'rb'))
    tree = pickle.load(open('final_tree.pickle', 'rb'))


    # test run
    cav1 = CAV(PCAmodel=PCAmodel, stored_arts=stored_arts, tree=tree)
    with tf.Session(graph=graph) as sess:
        for imagename in os.listdir('rough_brush'):
            print(imagename)
            # open image
            image = get_imarray(os.path.join('rough_brush', imagename))
            print(image.shape)
            # embeddings = images2emeddings(image, sess, PCAmodel)
            cav1.add_images_update_cav(image, ['rough_brush'], sess)
            # print(image.shape, embeddings.shape)



    # with tf.Session(graph=graph) as sess:
    #   flattened_gram(imarray, sess)

    
# if __name__ == "__main__":
#     main()