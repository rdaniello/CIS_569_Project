import os
import re
import nltk
from nltk.stem.porter import PorterStemmer
from nltk.tag import StanfordNERTagger
import pandas as pd
import numpy as np
import nltk
from nltk.stem.snowball import SnowballStemmer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
from scipy.cluster.hierarchy import ward, dendrogram
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

stemmer = SnowballStemmer("english")

titles = []
content = []
stopwords = nltk.corpus.stopwords.words('english')

for i in range(len(stopwords)):
    stopwords[i] = stemmer.stem(stopwords[i])

with os.scandir('../data/raw_data') as entries:
    for entry in entries:
        #print(entry.name)
        titles.append(entry.name)
        with open(entry,'r') as f:
            content.append(f.read())
            

    #         for i in range(len(tokens)):
    #             tokens[i] = stemmer.stem(tokens[i])
    #         print(tokens)
    # print (titles[:10])
    # print(content[:10])
    # print(stopwords)

def testEntTokenizer():
    for fileTxt in content:
        print(tokenize_ent(fileTxt))
    
def tokenize_ent(text):
    tokens = nltk.word_tokenize(text)
    taggedSentence = st.tag(tokens)

    ents = []

    idx = 0
    while idx < len(taggedSentence):
        if(taggedSentence[idx][1] != 'O'):
            entVal = taggedSentence[idx][0]
            currTag = taggedSentence[idx][1]
            idx += 1
            while taggedSentence[idx][1] == currTag and idx < len(taggedSentence):
                if(taggedSentence[idx][0] != ","):
                    entVal = entVal + ' ' + taggedSentence[idx][0] 
                idx += 1
                if(idx == len(taggedSentence)):
                    break
            ents.append(entVal)
        else:
            idx += 1
    print(ents)
    return ents

def tokenize(text):
        # my text was unicode so I had to use the unicode-specific translate function. If your documents are strings, you will need to use a different `translate` function here. `Translated` here just does search-replace. See the trans_table: any matching character in the set is replaced with `None`
        tokens = [word for word in nltk.word_tokenize(text) if len(word) > 1] #if len(word) > 1 because I only want to retain words that are at least two characters before stemming, although I can't think of any such words that are not also stopwords
        stems = [stemmer.stem(item) for item in tokens]
        return stems
    
def process_data():
    # get tfidf matrix 
    #tfidf_vectorizer = TfidfVectorizer(tokenizer=tokenize_ent, binary=True, use_idf=True, lowercase=False,
                                   #min_df=2, max_df=0.1)
    #tfidf_matrix = tfidf_vectorizer.fit_transform(content) #fit the vectorizer to file contents

    # save to pickle - running tokenization with entites is slow and won't change
    # unless vectorizer parmas or dataset change
    #pickle.dump(tfidf_vectorizer,open("../data/artifacts/vectorizer.pickle", "wb"))
    #pickle.dump(tfidf_matrix,open("../data/artifacts/tfidf_matrix.pickle", "wb"))

    # if tfidf is saved to to pickle then load from there - preferred
    tfidf_vectorizer = pickle.load(open("../data/artifacts/vectorizer.pickle", "rb"))
    tfidf_matrix = pickle.load(open("../data/artifacts/tfidf_matrix.pickle", "rb"))

    featureNames = tfidf_vectorizer.get_feature_names()

    optimal_K = 19  # from previous run
    # find an optimal k - differnent ways to do this
    # method selected finds smallest square error of k
    # between .33 and .5 of # of files
    # can be commented out once optimal k is known
    #optimal_K = find_opt_K(tfidf_matrix, len(content))
    
    
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
    filename = "../data/processed_data/processed_clusters.csv"
    
    # write to csv file 
    with open(filename, 'w', newline='') as csvfile: 
        # creating a csv writer object 
        csvwriter = csv.writer(csvfile) 
            
        # writing the fields 
        csvwriter.writerow(fields) 
            
        # writing the data rows 
        csvwriter.writerows(rows)

    print(order_centroids)

    # write processed data files
    docs = { 'name': titles, 'text': content, 'cluster': clusters}
    frame = pd.DataFrame(docs, index = [clusters] , columns = ['name', 'text', 'cluster'])
    print(frame['cluster'].value_counts())
    frame.to_csv(r'../data/processed_data/processed_files.csv', index = False, header=True)

    # # cluster infor
    # docs = { 'name': titles, 'text': content, 'cluster': clusters}
    # frameDocs = pd.DataFrame(docs, index = [clusters] , columns = ['name', 'text', 'cluster'])
    # print(frame['cluster'].value_counts())
    # frameDocs.to_csv(r'dataset/processed_data/processed_data.csv', index = False, header=True)

    #print(frame)

    # corpus_index = [n for n in titles]
    # feature_names = tfidf_vectorizer.get_feature_names()
    # df = pd.DataFrame(tfidf_matrix.todense(), index=titles, columns=feature_names)
    # df.to_csv(r'tfidf_matrix.csv', index = True, header=True)

    # print(tfidf_matrix.shape)

    # dist = 1- cosine_similarity(tfidf_matrix)
    # df = pd.DataFrame(dist)
    # sorteIdx = np.argsort(df)


    # bestIdx = sorteIdx[1]

    # for i in range(len(bestIdx)):
    #     print (titles[i] + "   " + titles[bestIdx[i]])

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


def test():
    stemmer = SnowballStemmer("english")

    titles = []
    content = []
    stopwords = nltk.corpus.stopwords.words('english')

    for i in range(len(stopwords)):
        stopwords[i] = stemmer.stem(stopwords[i])

    with os.scandir('./data') as entries:
        for entry in entries:
            #print(entry.name)
            titles.append(entry.name)
            with open(entry,'r') as f:
                content.append(f.read())
                

                #for i in range(len(tokens)):
                    #tokens[i] = stemmer.stem(tokens[i])
                #print(tokens)
        #print (titles[:10])
        print(content[:10])
        #print(stopwords)


process_data()
#testEntTokenizer();