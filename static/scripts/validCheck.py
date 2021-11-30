import os
import math
import json
from PIL import Image

texturePath = "../Korean"
exprList = []


def checkChild(mN):
    global exprList

    path = texturePath + "/" + mN + "/"
    files = []
    files.append(path + "MOC." + mN + ".json")
    files.append(path + "character.dat")
    files.append(path + mN + "_idle.mtn")
    files.append(path + mN + "_attack.mtn")
    files.append(path + "texture_00.png")

    for f in files:
        if not os.path.isfile(f):
            print mN + ": file not found - " + f

    if os.path.isfile(path + "texture_00.png"):
        img = Image.open(path + "texture_00.png")
        width, height = img.size
        if not math.log(width, 2).is_integer() or not math.log(height, 2).is_integer():
            print mN + ": invalid texture image - texture_00.png"

    if os.path.isfile(path + "texture_01.png"):
        img = Image.open(path + "texture_01.png")
        width, height = img.size
        if not math.log(width, 2).is_integer() or not math.log(height, 2).is_integer():
            print mN + ": invalid texture image - texture_01.png"
    
    jsonFile = path + "MOC." + mN + ".json"
    if os.path.isfile(jsonFile):
        with open(path + "MOC." + mN + ".json") as json_file:
            data = json.load(json_file)

            for t in data["textures"]:
                if t != "texture_00.png" and t != "texture_01.png":
                    print mN + ": weird texture file name - " + t

            if data["model"] != "character.dat":
                print mN + ": weird model file name - " + data["model"]

            for m in data["motions"]:
                if data["motions"][m][0]["file"] != mN + "_" + m + ".mtn":
                    print mN + ": weird motion file name - " + data["motions"][m][0]["file"]

            if "expressions" in data:
#            if mN[0] == 's' or mN[0] == 'm':
#                print mN + " has expression file!"
#            if mN[0] == 'm':
#                print mN + " has exprs!"
                for expr in data["expressions"]:
                    if not os.path.isfile(path + expr["file"]):
                        print mN + ": expression file does not exist - " + expr["file"]

                exprList.append(mN)

#        elif mN[0] != 's' and mN[0] != 'm':
#            print mN + ": doesn't have expression file!"

def checkSpa(mN):
    path = texturePath + "/" + mN + "/"
    files = []
    files.append(path + "MOC." + mN + ".json")
    files.append(path + "character.dat")
    files.append(path + mN + "_idle.mtn")
    files.append(path + mN + "_touch.mtn")
    files.append(path + mN + "_max.mtn")
    files.append(path + mN + "_maxtouch.mtn")
    files.append(path + "texture_00.png")

    for f in files:
        if not os.path.isfile(f):
            print mN + ": file not found - " + f


def main():
    for mN in next(os.walk(texturePath))[1]:
        if mN[0] == 'c' or mN[0] == 'm' or mN[0] == 'x':
            checkChild(mN)

        elif mN[0] == 's':
            checkSpa(mN)

        else:
            print mN + ": unknown modelName"

    f = open("res/textureListExprRaw.txt", "w")

    for mN in exprList:
        f.write(mN + '\n')

    f.close()

if __name__ == "__main__":
    main()
