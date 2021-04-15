import os
import re
import nltk
from nltk.tag import StanfordNERTagger
import pandas as pd
import numpy as np
import nltk
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
from sklearn.manifold import MDS
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt
import pickle
import csv

# clear screen, set java path and entity tagger locations
os.system('cls')
java_path = "C:/Program Files/Java/jre1.8.0_281/bin/java.exe"
os.environ['JAVAHOME'] = java_path
model = 'stanford-ner/english.muc.7class.distsim.crf.ser.gz'
jar = 'stanford-ner/stanford-ner-4.2.0.jar'
st = StanfordNERTagger(model,jar) #https://rikenshah.github.io/articles/named-entity-recognition-with-nltk/

titles = []     # document titles
content = []    # document contents

# load document names and contents
with os.scandir('../data/raw_data') as entries:
    for entry in entries:
        #print(entry.name)
        titles.append(entry.name)
        with open(entry,'r') as f:
            content.append(f.read())
    
# custom tokenizer for creating tfidf matrix
# returns named entities as tokens
def tokenize_ent(text):
    # get the tokens from text
    tokens = nltk.word_tokenize(text)

    # tag the tokens
    taggedText = st.tag(tokens)

    # named entities found
    ents = []

    # for each token 
    idx = 0
    while idx < len(taggedText):
        # if named entity
        if(taggedText[idx][1] != 'O'):
            entVal = taggedText[idx][0]
            currTag = taggedText[idx][1]
            idx += 1
            # combine named entity tokens if necessary
            while taggedText[idx][1] == currTag and idx < len(taggedText):
                if(taggedText[idx][0] != ","):
                    entVal = entVal + ' ' + taggedText[idx][0] 
                idx += 1
                if(idx == len(taggedText)):
                    break
            # add entity to entity list
            ents.append(entVal)
        else:
            idx += 1
    print(ents)

    # return the entity list 
    return ents
    
# process data and create data files
## PARAMS
## run_optK - run code to create elbow plot for determining opt k
## create_TFIDF - create TFIDF and run entity recognition or load from pickle
## optK - optimal K - K value once optimal K is determined. Ignored if run_optK = True
def process_data(run_optK, create_TFIDF, optK):
    # if need to create TFIDF matrix
    if(create_TFIDF):
        # get tfidf matrix 
        tfidf_vectorizer = TfidfVectorizer(tokenizer=tokenize_ent, binary=True, use_idf=True, lowercase=False,
                                    min_df=2, max_df=0.1)
        tfidf_matrix = tfidf_vectorizer.fit_transform(content) #fit the vectorizer to file contents

        # save to pickle - running tokenization with entites is slow and won't change
        # unless vectorizer parmas or dataset change
        pickle.dump(tfidf_vectorizer,open("../data/artifacts/vectorizer.pickle", "wb"))
        pickle.dump(tfidf_matrix,open("../data/artifacts/tfidf_matrix.pickle", "wb"))
    else:
        # if tfidf is saved to to pickle then load from there - preferred
        tfidf_vectorizer = pickle.load(open("../data/artifacts/vectorizer.pickle", "rb"))
        tfidf_matrix = pickle.load(open("../data/artifacts/tfidf_matrix.pickle", "rb"))

    # get vocab of files for creating cluster data file
    featureNames = tfidf_vectorizer.get_feature_names()

    optimal_K = optK  # from previous run
    if(run_optK):
        # find an optimal k - differnent ways to do this
        # method selected finds smallest square error of k
        optimal_K = find_opt_K(tfidf_matrix, len(content))
    
    
    # run k-means with optimal k
    km = KMeans(n_clusters=optimal_K)
    km = km.fit(tfidf_matrix)
    clusters = km.labels_.tolist()
    order_centroids = km.cluster_centers_.argsort()[:, ::-1] 

    # extract top five entities for each cluster
    fields = ['cluster', 'e1', 'e2', 'e3', 'e4','e5']
    rows = []
    for centNum in range(len(order_centroids)):
        row = []
        row.append(str(centNum))
        print('Cluster: ' + str(centNum))
        for idx in range(5):
            row.append(featureNames[order_centroids[centNum][idx]])
            print('  ' + featureNames[order_centroids[centNum][idx]]) 
        rows.append(row)

    # CODE for project 3
    # get distance matrix
    dist = 1- cosine_similarity(tfidf_matrix)

    # perform MDS to 2 dimensions
    mds  = MDS(n_components=2, dissimilarity="precomputed", random_state=0)
    docPosition = mds.fit_transform(dist)

    # PCA
    # X = tfidf_matrix.todense()
    # docPosition = PCA(n_components=2).fit_transform(X)

    # get x and y arrays
    xPos = [el[0] for el in docPosition]
    yPos = [el[1] for el in docPosition]
    
    # df = pd.DataFrame(dist)
    # sorteIdx = np.argsort(df)
    # print(df)

    # write cluster data to csv file 
    filename = "../data/processed_data/processed_clusters.csv"
    with open(filename, 'w', newline='') as csvfile:  
        csvwriter = csv.writer(csvfile) 
        csvwriter.writerow(fields) 
        csvwriter.writerows(rows)

    #print(order_centroids)

    # write file data to csv file
    docs = { 'name': titles, 'text': content, 'cluster': clusters, 'xPos': xPos, 'yPos': yPos}
    frame = pd.DataFrame(docs, index = [clusters] , columns = ['name', 'text', 'cluster', 'xPos', 'yPos'])
    frame.to_csv(r'../data/processed_data/processed_files.csv', index = False, header=True)

# runs K-means on data with range of k values
# saves plot of results for analysis
def find_opt_K(tfidf_matrix, numfiles):
    Sum_of_squared_distances = []
    # search realistic k values
    # between .3 and .5 of total number
    K = range(8, round(numfiles * .5))
    for k in K:
        km = KMeans(n_clusters=k)
        km = km.fit(tfidf_matrix)
        print(km.inertia_)
        Sum_of_squared_distances.append(km.inertia_)
    
    plt.plot(K, Sum_of_squared_distances, 'bx-')
    plt.xlabel('k')
    plt.ylabel('Sum_of_squared_distances')
    plt.title('Sum of sq error vs K')
    plt.savefig('../data/artifacts/k-means_sq_err_plot.png')

    return K[np.argmin(Sum_of_squared_distances)]

# process the data
process_data(run_optK=False, create_TFIDF=False, optK=19)